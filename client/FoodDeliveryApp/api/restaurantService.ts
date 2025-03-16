import apiService from "./apiService";

interface RestaurantOpeningHours {
  day: number;
  open: string;
  close: string;
  isClosed: boolean;
}

interface RestaurantLocation {
  lat: number;
  lng: number;
}

interface RestaurantData {
  name: string;
  description: string;
  address: string;
  location: RestaurantLocation;
  categories: string[];
  openingHours: RestaurantOpeningHours[];
  deliveryFee: number;
  minOrderAmount: number;
  estimatedDeliveryTime: number;
  phoneNumber: string;
}

interface UpdateRestaurantData {
  name?: string;
  description?: string;
  address?: string;
  location?: RestaurantLocation;
  categories?: string[];
  openingHours?: RestaurantOpeningHours[];
  deliveryFee?: number;
  minOrderAmount?: number;
  estimatedDeliveryTime?: number;
  phoneNumber?: string;
  status?: number;
}

interface GetAllRestaurantsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  minRating?: number;
  search?: string;
}
export const restaurantService = {
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

  async getNearbyRestaurants(lat: number, lng: number, radius = 5) {
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

  async getRestaurantsByCategory(category: string, page = 1, limit = 10) {
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

  async getRestaurantById(id: string) {
    try {
      const response = await apiService.get(`/restaurants/${id}`);
      return response.result;
    } catch (error) {
      console.error("Get restaurant by ID error:", error);
      throw error;
    }
  },

  // Đã cập nhật trong menuService.ts, giữ lại để tương thích ngược
  async getRestaurantMenu(id: string) {
    try {
      const response = await apiService.get(`/restaurants/${id}/menu`);
      return response.result;
    } catch (error) {
      console.error("Get restaurant menu error:", error);
      throw error;
    }
  },

  async getRestaurantRatings(id: string, page = 1, limit = 10) {
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

  async getRestaurantOrders(
    id: string,
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

  async getRestaurantRevenue(
    id: string,
    period = "monthly",
    year: string,
    month?: string
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

  async createRestaurant(restaurantData: RestaurantData) {
    try {
      const response = await apiService.post("/restaurants", restaurantData);
      return response.result;
    } catch (error) {
      console.error("Create restaurant error:", error);
      throw error;
    }
  },

  async updateRestaurant(id: string, updateData: UpdateRestaurantData) {
    try {
      const response = await apiService.put(`/restaurants/${id}`, updateData);
      return response.result;
    } catch (error) {
      console.error("Update restaurant error:", error);
      throw error;
    }
  },

  async deleteRestaurant(id: string) {
    try {
      const response = await apiService.delete(`/restaurants/${id}`);
      return response.result;
    } catch (error) {
      console.error("Delete restaurant error:", error);
      throw error;
    }
  },

  async uploadRestaurantImages(
    id: string,
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
