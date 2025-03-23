import apiService from "./apiService";

interface UserData {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  phone: string;
  role: number;
}

export const authService = {
  // Thêm kiểu dữ liệu cụ thể
  async login(email: string, password: string) {
    try {
      const response = await apiService.post("/auth/login", {
        email,
        password,
      });
      console.log("Login response:", response);

      return response;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  async register(userData: UserData) {
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

  async logout(refreshToken: string) {
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

  async refreshToken(refreshToken: string) {
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

  async verifyEmail(token: string) {
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

  async forgotPassword(email: string) {
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

  async resetPassword(token: string, password: string) {
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

  async getUserProfile() {
    try {
      const response = await apiService.get("/users/profile");
      return response.result;
    } catch (error) {
      console.error("Get user profile error:", error);
      throw error;
    }
  },

  async updateProfile(profileData: {
    name?: string;
    phone?: string;
    date_of_birth?: string; // Cập nhật để phản ánh đúng API
  }) {
    try {
      const response = await apiService.put("/users/profile", profileData);
      return response.result;
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  },

  async changePassword(oldPassword: string, newPassword: string) {
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

  async uploadAvatar(imageUri: string) {
    try {
      const formData = new FormData();

      // Parse filename from URI
      const filename = imageUri.split("/").pop();

      // Determine MIME type
      const match = /\.(\w+)$/.exec(filename as string);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      // @ts-ignore - React Native's FormData implementation differs from standard
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
};

export default authService;
