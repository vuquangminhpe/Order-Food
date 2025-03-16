import apiService from "./apiService";

interface GetAllRestaurantsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  minRating?: number;
  search?: string;
}

export const restaurantService = {
  // Get all restaurants with pagination and filters
  async getAllRestaurants(params: GetAllRestaurantsParams = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "rating",
        sortOrder = "desc",
        minRating,
        search,
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: sortBy.toString(),
        sortOrder: sortOrder.toString(),
        ...(minRating && { minRating: minRating.toString() }),
        ...(search && { search: search.toString() }),
      }).toString();

      const response = await apiService.get(`/restaurants?${queryParams}`);
      return response.result;
    } catch (error) {
      console.error("Get all restaurants error:", error);
      throw error;
    }
  },

  // Get restaurants near a location
  async getNearbyRestaurants(lat: any, lng: any, radius = 5) {
    try {
      const queryParams = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: radius.toString(),
      }).toString();

      const response = await apiService.get(
        `/restaurants/nearby?${queryParams}`
      );
      return response.result;
    } catch (error) {
      console.error("Get nearby restaurants error:", error);
      throw error;
    }
  },

  // Get restaurants by category
  async getRestaurantsByCategory(category: any, page = 1, limit = 10) {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      }).toString();

      const response = await apiService.get(
        `/restaurants/category/${category}?${queryParams}`
      );
      return response.result;
    } catch (error) {
      console.error("Get restaurants by category error:", error);
      throw error;
    }
  },

  // Get restaurant by ID
  async getRestaurantById(id: any) {
    try {
      const response = await apiService.get(`/restaurants/${id}`);
      return response.result;
    } catch (error) {
      console.error("Get restaurant by ID error:", error);
      throw error;
    }
  },

  // Get restaurant menu
  async getRestaurantMenu(id: any) {
    try {
      const response = await apiService.get(`/restaurants/${id}/menu`);
      return response.result;
    } catch (error) {
      console.error("Get restaurant menu error:", error);
      throw error;
    }
  },

  // Get restaurant ratings
  async getRestaurantRatings(id: any, page = 1, limit = 10) {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      }).toString();

      const response = await apiService.get(
        `/restaurants/${id}/ratings?${queryParams}`
      );
      return response.result;
    } catch (error) {
      console.error("Get restaurant ratings error:", error);
      throw error;
    }
  },

  // For restaurant owners: Get restaurant orders
  async getRestaurantOrders(
    id: any,
    params: {
      page?: number;
      limit?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ) {
    try {
      const { page = 1, limit = 10, status, startDate, endDate } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status !== undefined && { status }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      }).toString();

      const response = await apiService.get(
        `/restaurants/${id}/orders?${queryParams}`
      );
      return response.result;
    } catch (error) {
      console.error("Get restaurant orders error:", error);
      throw error;
    }
  },

  // For restaurant owners: Get restaurant revenue
  async getRestaurantRevenue(
    id: any,
    period = "monthly",
    year: any,
    month: any
  ) {
    try {
      const queryParams = new URLSearchParams({
        period,
        ...(year && { year }),
        ...(month && { month }),
      }).toString();

      const response = await apiService.get(
        `/restaurants/${id}/revenue?${queryParams}`
      );
      return response.result;
    } catch (error) {
      console.error("Get restaurant revenue error:", error);
      throw error;
    }
  },

  // For restaurant owners: Create restaurant
  async createRestaurant(restaurantData: any) {
    try {
      const response = await apiService.post("/restaurants", restaurantData);
      return response.result;
    } catch (error) {
      console.error("Create restaurant error:", error);
      throw error;
    }
  },

  // For restaurant owners: Update restaurant
  async updateRestaurant(
    id: any,
    updateData: {
      name?: string;
      description?: string;
      address?: string;
      phone?: string;
      email?: string;
      deliveryFee?: number;
      minOrderAmount?: number;
      preparationTime?: number;
      active?: boolean;
      categories?: any[];
      openingHours?: {
        monday?: { open: string; close: string; isOpen: boolean };
        tuesday?: { open: string; close: string; isOpen: boolean };
        wednesday?: { open: string; close: string; isOpen: boolean };
        thursday?: { open: string; close: string; isOpen: boolean };
        friday?: { open: string; close: string; isOpen: boolean };
        saturday?: { open: string; close: string; isOpen: boolean };
        sunday?: { open: string; close: string; isOpen: boolean };
      };
    }
  ) {
    try {
      const response = await apiService.put(`/restaurants/${id}`, updateData);
      return response.result;
    } catch (error) {
      console.error("Update restaurant error:", error);
      throw error;
    }
  },

  // For restaurant owners: Delete restaurant
  async deleteRestaurant(id: any) {
    try {
      const response = await apiService.delete(`/restaurants/${id}`);
      return response.result;
    } catch (error) {
      console.error("Delete restaurant error:", error);
      throw error;
    }
  },

  // For restaurant owners: Upload restaurant images
  async uploadRestaurantImages(
    id: any,
    imageType: string,
    imageUris: string[]
  ) {
    try {
      const formData = new FormData();

      formData.append("imageType", imageType); // 'logo', 'cover', or 'gallery'

      // Append each image to the form data
      imageUris.forEach((uri, index) => {
        // Parse filename from URI
        const filename = uri.split("/").pop();

        // Determine MIME type
        const match = /\.(\w+)$/.exec(filename as string);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        // @ts-ignore - React Native's FormData implementation differs from standard
        formData.append("images", {
          uri,
          name: filename,
          type,
        });
      });

      const response = await apiService.upload(
        `/restaurants/${id}/images`,
        formData
      );
      return response.result;
    } catch (error) {
      console.error("Upload restaurant images error:", error);
      throw error;
    }
  },
};

export default restaurantService;