import { Platform } from "react-native";
import apiService from "./apiService";

interface UserProfile {
  name?: string;
  phone?: string;
  date_of_birth?: string; // Cập nhật để phản ánh đúng API server
}

interface Address {
  title: string;
  address: string;
  lat: number;
  lng: number;
  isDefault: boolean;
  notes?: string;
}

export const userService = {
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

  // Update user profile - cập nhật để phản ánh đúng API server
  async updateProfile(profileData: UserProfile) {
    try {
      const response = await apiService.put("/users/profile", profileData);
      return response.result;
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  },

  // Change password
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

  // Updated userService.uploadAvatar method
  async uploadAvatar(imageUri: string) {
    try {
      console.log("Starting avatar upload with URI:", imageUri);

      // Create FormData correctly for React Native
      const formData = new FormData();

      // Parse filename from URI
      const filename = imageUri.split("/").pop();

      // Determine MIME type - be more specific with extension matching
      let type = "image/jpeg"; // Default
      if (filename) {
        if (filename.endsWith(".png")) type = "image/png";
        else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg"))
          type = "image/jpeg";
        else if (filename.endsWith(".gif")) type = "image/gif";
        else if (filename.endsWith(".webp")) type = "image/webp";
      }

      console.log("Preparing file upload with:", { filename, type });

      // Add the file to FormData with the correct structure for React Native
      formData.append("avatar", {
        uri: Platform.OS === "ios" ? imageUri.replace("file://", "") : imageUri,
        name: filename || "photo.jpg",
        type,
      } as any);

      console.log("FormData created, sending to server...");

      // Log request details for debugging
      const requestDetails = {
        url: "/users/avatar",
        formDataEntries: Object.fromEntries(formData as any),
      };
      console.log("Request details:", JSON.stringify(requestDetails, null, 2));

      const response = await apiService.upload("/users/avatar", formData);
      console.log("Upload response:", response);

      // Return the full response for better debugging
      return response.result;
    } catch (error) {
      console.error("Upload avatar error:", error);
      throw error;
    }
  },
  // Get addresses
  async getAddresses() {
    try {
      const response = await apiService.get("/users/addresses");
      return response.result;
    } catch (error) {
      console.error("Get addresses error:", error);
      throw error;
    }
  },

  // Add address
  async addAddress(addressData: Address) {
    try {
      const response = await apiService.post("/users/addresses", addressData);
      return response.result;
    } catch (error) {
      console.error("Add address error:", error);
      throw error;
    }
  },

  // Update address
  async updateAddress(index: number, addressData: Partial<Address>) {
    try {
      const response = await apiService.put(
        `/users/addresses/${index}`,
        addressData
      );
      return response.result;
    } catch (error) {
      console.error("Update address error:", error);
      throw error;
    }
  },

  // Delete address
  async deleteAddress(index: number) {
    try {
      const response = await apiService.delete(`/users/addresses/${index}`);
      return response.result;
    } catch (error) {
      console.error("Delete address error:", error);
      throw error;
    }
  },

  // Update delivery person status
  async updateDeliveryStatus(isAvailable: boolean) {
    try {
      const response = await apiService.put("/users/delivery/status", {
        isAvailable,
      });
      return response.result;
    } catch (error) {
      console.error("Update delivery status error:", error);
      throw error;
    }
  },

  // Update location (for delivery personnel)
  async updateLocation(lat: number, lng: number) {
    try {
      const response = await apiService.put("/users/location", { lat, lng });
      return response.result;
    } catch (error) {
      console.error("Update location error:", error);
      throw error;
    }
  },

  // Get nearby delivery personnel
  async getNearbyDeliveryPersonnel(
    lat: number,
    lng: number,
    radius: number = 5
  ) {
    try {
      const response = await apiService.get(
        `/users/delivery/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
      );
      return response.result;
    } catch (error) {
      console.error("Get nearby delivery personnel error:", error);
      throw error;
    }
  },

  // Admin only: Get all users
  async getAllUsers(
    params: {
      page?: number;
      limit?: number;
      role?: number;
      verify?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: string;
    } = {}
  ) {
    try {
      const queryParams = new URLSearchParams({
        page: (params.page || 1).toString(),
        limit: (params.limit || 10).toString(),
        ...(params.role !== undefined && { role: params.role.toString() }),
        ...(params.verify !== undefined && {
          verify: params.verify.toString(),
        }),
        ...(params.search && { search: params.search }),
        ...(params.sortBy && { sortBy: params.sortBy }),
        ...(params.sortOrder && { sortOrder: params.sortOrder }),
      }).toString();

      const response = await apiService.get(`/users/admin/all?${queryParams}`);
      return response.result;
    } catch (error) {
      console.error("Get all users error:", error);
      throw error;
    }
  },

  // Admin only: Get user by ID
  async getUserById(userId: string) {
    try {
      const response = await apiService.get(`/users/admin/${userId}`);
      return response.result;
    } catch (error) {
      console.error("Get user by ID error:", error);
      throw error;
    }
  },

  // Admin only: Ban user
  async banUser(userId: string, reason: string) {
    try {
      const response = await apiService.post(`/users/admin/ban/${userId}`, {
        reason,
      });
      return response.result;
    } catch (error) {
      console.error("Ban user error:", error);
      throw error;
    }
  },

  // Admin only: Unban user
  async unbanUser(userId: string) {
    try {
      const response = await apiService.post(`/users/admin/unban/${userId}`);
      return response.result;
    } catch (error) {
      console.error("Unban user error:", error);
      throw error;
    }
  },

  // Admin only: Get restaurant owners
  async getRestaurantOwners(page: number = 1, limit: number = 10) {
    try {
      const response = await apiService.get(
        `/users/admin/restaurant-owners?page=${page}&limit=${limit}`
      );
      return response.result;
    } catch (error) {
      console.error("Get restaurant owners error:", error);
      throw error;
    }
  },

  // Admin only: Get delivery personnel
  async getDeliveryPersonnel(page: number = 1, limit: number = 10) {
    try {
      const response = await apiService.get(
        `/users/admin/delivery-personnel?page=${page}&limit=${limit}`
      );
      return response.result;
    } catch (error) {
      console.error("Get delivery personnel error:", error);
      throw error;
    }
  },
};

export default userService;
