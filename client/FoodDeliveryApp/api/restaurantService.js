import apiService from "./apiService";

export const restaurantService = {
  // Get all restaurants with pagination and filters
  async getAllRestaurants(params = {}) {
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
        page,
        limit,
        sortBy,
        sortOrder,
        ...(minRating && { minRating }),
        ...(search && { search }),
      }).toString();

      const response = await apiService.get(`/restaurants?${queryParams}`);
      return response.result;
    } catch (error) {
      console.error("Get all restaurants error:", error);
      throw error;
    }
  },

  // Get restaurants near a location
  async getNearbyRestaurants(lat, lng, radius = 5) {
    try {
      const queryParams = new URLSearchParams({
        lat,
        lng,
        radius,
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
  async getRestaurantsByCategory(category, page = 1, limit = 10) {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
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
  async getRestaurantById(id) {
    try {
      const response = await apiService.get(`/restaurants/${id}`);
      return response.result;
    } catch (error) {
      console.error("Get restaurant by ID error:", error);
      throw error;
    }
  },

  // Get restaurant menu
  async getRestaurantMenu(id) {
    try {
      const response = await apiService.get(`/restaurants/${id}/menu`);
      return response.result;
    } catch (error) {
      console.error("Get restaurant menu error:", error);
      throw error;
    }
  },

  // Get restaurant ratings
  async getRestaurantRatings(id, page = 1, limit = 10) {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
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
  async getRestaurantOrders(id, params = {}) {
    try {
      const { page = 1, limit = 10, status, startDate, endDate } = params;

      const queryParams = new URLSearchParams({
        page,
        limit,
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
  async getRestaurantRevenue(id, period = "monthly", year, month) {
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
  async createRestaurant(restaurantData) {
    try {
      const response = await apiService.post("/restaurants", restaurantData);
      return response.result;
    } catch (error) {
      console.error("Create restaurant error:", error);
      throw error;
    }
  },

  // For restaurant owners: Update restaurant
  async updateRestaurant(id, updateData) {
    try {
      const response = await apiService.put(`/restaurants/${id}`, updateData);
      return response.result;
    } catch (error) {
      console.error("Update restaurant error:", error);
      throw error;
    }
  },

  // For restaurant owners: Delete restaurant
  async deleteRestaurant(id) {
    try {
      const response = await apiService.delete(`/restaurants/${id}`);
      return response.result;
    } catch (error) {
      console.error("Delete restaurant error:", error);
      throw error;
    }
  },

  // For restaurant owners: Upload restaurant images
  async uploadRestaurantImages(id, imageType, imageUris) {
    try {
      const formData = new FormData();

      formData.append("imageType", imageType); // 'logo', 'cover', or 'gallery'

      // Append each image to the form data
      imageUris.forEach((uri, index) => {
        // Parse filename from URI
        const filename = uri.split("/").pop();

        // Determine MIME type
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

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
