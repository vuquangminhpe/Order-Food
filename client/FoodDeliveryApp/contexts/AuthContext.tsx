import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { authService } from "../api/authService";

// User roles
export const USER_ROLES = {
  CUSTOMER: 0,
  RESTAURANT_OWNER: 1,
  DELIVERY_PERSON: 2,
  ADMIN: 3,
};

// Auth context
export const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  initialized: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<User | undefined>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    confirm_password: string;
    phone: string;
    role: number;
  }) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<User>;
  verifyEmail: (token: string) => Promise<{ success: boolean }>;
  hasRole: (role: number) => boolean;
  isAuthenticated: () => boolean;
  USER_ROLES: typeof USER_ROLES;
}>({
  user: null,
  loading: true,
  initialized: false,
  accessToken: null,
  refreshToken: null,
  login: async () => undefined,
  register: async () => {},
  logout: async () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
  updateProfile: async () => ({} as User),
  verifyEmail: async () => ({ success: false }),
  hasRole: () => false,
  isAuthenticated: () => false,
  USER_ROLES,
});

export const useAuth = () => useContext(AuthContext);

interface User {
  date_of_birth: any;
  id: string;
  name: string;
  email: string;
  role: number;
  avatar?: string;
  phone?: string;
  verify?: number;
  created_at?: string;
  updated_at?: string;
  address?: string;
  restaurantId?: any;
}

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Set up axios interceptor for handling auth
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          refreshToken
        ) {
          originalRequest._retry = true;
          try {
            const result = await authService.refreshToken(refreshToken);
            setAccessToken(result.access_token);
            setRefreshToken(result.refresh_token);
            await saveTokens(result.access_token, result.refresh_token);

            // Update the authorization header and retry the request
            originalRequest.headers.Authorization = `Bearer ${result.access_token}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // If refresh fails, log out
            logout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    // Clean up interceptors when component unmounts
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken, refreshToken]);

  // Initialize - check for stored auth tokens
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const storedAccessToken = await AsyncStorage.getItem("accessToken");
        const storedRefreshToken = await AsyncStorage.getItem("refreshToken");

        if (storedAccessToken && storedRefreshToken) {
          setAccessToken(storedAccessToken as any);
          setRefreshToken(storedRefreshToken as any);

          // Fetch user profile with the stored token
          try {
            const userProfile = await authService.getUserProfile();
            setUser(userProfile);
          } catch (error) {
            // Token may be expired, try to refresh
            try {
              const result = await authService.refreshToken(storedRefreshToken);
              setAccessToken(result.access_token);
              setRefreshToken(result.refresh_token);
              await saveTokens(result.access_token, result.refresh_token);

              // Now fetch user profile with the new token
              const userProfile = await authService.getUserProfile();
              setUser(userProfile);
            } catch (refreshError) {
              // If refresh fails, clear everything
              await clearTokens();
              setAccessToken(null);
              setRefreshToken(null);
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Save tokens to storage
  const saveTokens = async (accessToken: any, refreshToken: any) => {
    try {
      await AsyncStorage.setItem("accessToken", accessToken);
      await AsyncStorage.setItem("refreshToken", refreshToken);
    } catch (error) {
      console.error("Error saving tokens:", error);
    }
  };

  // Clear tokens from storage
  const clearTokens = async () => {
    try {
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");
    } catch (error) {
      console.error("Error clearing tokens:", error);
    }
  };

  // Login handler
  const login = async (email: any, password: any) => {
    try {
      setLoading(true);
      const result = await authService.login(email, password);

      setAccessToken(result.access_token);
      setRefreshToken(result.refresh_token);
      await saveTokens(result.access_token, result.refresh_token);

      const userProfile = await authService.getUserProfile();
      setUser(userProfile);
      return userProfile;
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (userData: {
    name: any;
    email: any;
    password: any;
    confirm_password: any;
    phone: any;
    role: any;
  }) => {
    try {
      setLoading(true);
      return await authService.register(userData);
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      setLoading(true);
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      await clearTokens();
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      setLoading(false);
    }
  };

  // Request password reset
  const forgotPassword = async (email: any) => {
    try {
      setLoading(true);
      return await authService.forgotPassword(email);
    } finally {
      setLoading(false);
    }
  };

  // Reset password with token
  const resetPassword = async (token: any, password: any) => {
    try {
      setLoading(true);
      return await authService.resetPassword(token, password);
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (profileData: Partial<User>) => {
    try {
      setLoading(true);
      const updatedProfile = await authService.updateProfile(
        profileData as any
      );
      setUser((prev) =>
        prev ? { ...prev, ...updatedProfile } : updatedProfile
      );
      return updatedProfile;
    } finally {
      setLoading(false);
    }
  };

  // Verify email
  const verifyEmail = async (token: any) => {
    try {
      setLoading(true);
      const result = await authService.verifyEmail(token);
      if (result.success) {
        // Update user verify status
        setUser((prev) => (prev ? { ...prev, verify: 1 } : prev));
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  // Check if user has a specific role
  const hasRole = (role: any) => {
    return user?.role === role;
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  const value = {
    user,
    loading,
    initialized,
    accessToken,
    refreshToken,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    verifyEmail,
    hasRole,
    isAuthenticated,
    USER_ROLES,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
