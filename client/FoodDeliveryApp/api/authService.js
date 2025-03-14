import apiService from "./apiService";

export const authService = {
  // Login with email and password
  async login(email, password) {
    try {
      const response = await apiService.post("/auth/login", {
        email,
        password,
      });
      return response.result;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // Register a new user
  async register(userData) {
    try {
      const { name, email, password, confirm_password, phone, role } = userData;

      const response = await apiService.post("/auth/register", {
        name,
        email,
        password,
        confirm_password,
        phone,
        role,
      });

      return response.result;
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  },

  // Logout (invalidate refresh token)
  async logout(refreshToken) {
    try {
      const response = await apiService.post("/auth/logout", {
        refresh_token: refreshToken,
      });
      return response;
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  },

  // Refresh access token using refresh token
  async refreshToken(refreshToken) {
    try {
      const response = await apiService.post("/auth/refresh-token", {
        refresh_token: refreshToken,
      });
      return response.result;
    } catch (error) {
      console.error("Refresh token error:", error);
      throw error;
    }
  },

  // Verify email with token
  async verifyEmail(token) {
    try {
      const response = await apiService.get(`/auth/verify-email/${token}`);
      return {
        success: true,
        ...response,
      };
    } catch (error) {
      console.error("Verify email error:", error);
      throw error;
    }
  },

  // Request password reset
  async forgotPassword(email) {
    try {
      const response = await apiService.post("/auth/forgot-password", {
        email,
      });
      return response;
    } catch (error) {
      console.error("Forgot password error:", error);
      throw error;
    }
  },

  // Reset password with token
  async resetPassword(token, password) {
    try {
      const response = await apiService.post("/auth/reset-password", {
        token,
        password,
        confirm_password: password,
      });
      return response;
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  },

  // Get user profile
  async getUserProfile() {
    try {
      const response = await apiService.get("/users/profile");
      return response.result;
    } catch (error) {
      console.error("Get user profile error:", error);
      throw error;
    }
  },

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await apiService.put("/users/profile", profileData);
      return response.result;
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  },

  // Change password
  async changePassword(oldPassword, newPassword) {
    try {
      const response = await apiService.put("/users/change-password", {
        old_password: oldPassword,
        password: newPassword,
        confirm_password: newPassword,
      });
      return response;
    } catch (error) {
      console.error("Change password error:", error);
      throw error;
    }
  },

  // Upload avatar
  async uploadAvatar(imageUri) {
    try {
      const formData = new FormData();

      // Parse filename from URI
      const filename = imageUri.split("/").pop();

      // Determine MIME type
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("avatar", {
        uri: imageUri,
        name: filename,
        type,
      });

      const response = await apiService.upload("/users/avatar", formData);
      return response.result;
    } catch (error) {
      console.error("Upload avatar error:", error);
      throw error;
    }
  },

  // Check if access token is valid
  async validateToken(token) {
    try {
      const response = await apiService.get("/auth/validate-token");
      return response.valid;
    } catch (error) {
      console.error("Validate token error:", error);
      return false;
    }
  },
};

export default authService;
