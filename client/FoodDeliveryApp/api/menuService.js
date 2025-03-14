import apiService from "./apiService";

export const menuService = {
  // Get restaurant's complete menu
  async getRestaurantMenu(restaurantId) {
    try {
      const response = await apiService.get(`/menu/restaurant/${restaurantId}`);
      return response.result;
    } catch (error) {
      console.error("Get restaurant menu error:", error);
      throw error;
    }
  },

  // Get popular menu items
  async getPopularMenuItems(restaurantId, limit = 10) {
    try {
      const response = await apiService.get(
        `/menu/popular/${restaurantId}?limit=${limit}`
      );
      return response.result;
    } catch (error) {
      console.error("Get popular menu items error:", error);
      throw error;
    }
  },

  // Get menu categories
  async getMenuCategories(restaurantId) {
    try {
      const response = await apiService.get(`/menu/categories/${restaurantId}`);
      return response.result;
    } catch (error) {
      console.error("Get menu categories error:", error);
      throw error;
    }
  },

  // Get menu item details
  async getMenuItem(itemId) {
    try {
      const response = await apiService.get(`/menu/item/${itemId}`);
      return response.result;
    } catch (error) {
      console.error("Get menu item error:", error);
      throw error;
    }
  },

  // For restaurant owners: Create menu item
  async createMenuItem(menuItemData) {
    try {
      const response = await apiService.post("/menu/item", menuItemData);
      return response.result;
    } catch (error) {
      console.error("Create menu item error:", error);
      throw error;
    }
  },

  // For restaurant owners: Update menu item
  async updateMenuItem(itemId, updateData) {
    try {
      const response = await apiService.put(`/menu/item/${itemId}`, updateData);
      return response.result;
    } catch (error) {
      console.error("Update menu item error:", error);
      throw error;
    }
  },

  // For restaurant owners: Delete menu item
  async deleteMenuItem(itemId) {
    try {
      const response = await apiService.delete(`/menu/item/${itemId}`);
      return response.result;
    } catch (error) {
      console.error("Delete menu item error:", error);
      throw error;
    }
  },

  // For restaurant owners: Update menu item availability
  async updateMenuItemAvailability(itemId, isAvailable) {
    try {
      const response = await apiService.patch(
        `/menu/item/${itemId}/availability`,
        {
          isAvailable,
        }
      );
      return response.result;
    } catch (error) {
      console.error("Update menu item availability error:", error);
      throw error;
    }
  },

  // For restaurant owners: Upload menu item image
  async uploadMenuItemImage(itemId, imageUri) {
    try {
      const formData = new FormData();

      // Parse filename from URI
      const filename = imageUri.split("/").pop();

      // Determine MIME type
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("image", {
        uri: imageUri,
        name: filename,
        type,
      });

      const response = await apiService.upload(
        `/menu/item/${itemId}/image`,
        formData
      );
      return response.result;
    } catch (error) {
      console.error("Upload menu item image error:", error);
      throw error;
    }
  },

  // For restaurant owners: Batch update menu items
  async batchUpdateMenuItems(items) {
    try {
      const response = await apiService.post("/menu/items/batch", {
        items,
      });
      return response.result;
    } catch (error) {
      console.error("Batch update menu items error:", error);
      throw error;
    }
  },

  // For restaurant owners: Create menu category
  async createMenuCategory(categoryData) {
    try {
      const response = await apiService.post("/menu/category", categoryData);
      return response.result;
    } catch (error) {
      console.error("Create menu category error:", error);
      throw error;
    }
  },

  // For restaurant owners: Update menu category
  async updateMenuCategory(categoryId, updateData) {
    try {
      const response = await apiService.put(
        `/menu/category/${categoryId}`,
        updateData
      );
      return response.result;
    } catch (error) {
      console.error("Update menu category error:", error);
      throw error;
    }
  },

  // For restaurant owners: Delete menu category
  async deleteMenuCategory(categoryId) {
    try {
      const response = await apiService.delete(`/menu/category/${categoryId}`);
      return response.result;
    } catch (error) {
      console.error("Delete menu category error:", error);
      throw error;
    }
  },
};

export default menuService;
