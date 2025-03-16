import apiService from "./apiService";
interface MenuItemOption {
  title: string;
  required: boolean;
  multiple: boolean;
  items: {
    name: string;
    price: number;
  }[];
}

interface MenuItemData {
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  discountedPrice?: number;
  categoryId: string;
  options?: MenuItemOption[];
  isAvailable: boolean;
}

interface MenuCategoryData {
  restaurantId: string;
  name: string;
  description?: string;
  order?: number;
}

export const menuService = {
  async getRestaurantMenu(restaurantId: string) {
    try {
      const response = await apiService.get(
        `/restaurants/${restaurantId}/menu`
      );
      return response.result;
    } catch (error) {
      console.error("Get restaurant menu error:", error);
      throw error;
    }
  },

  async getPopularMenuItems(restaurantId: string, limit = 10) {
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

  async getMenuCategories(restaurantId: string) {
    try {
      const response = await apiService.get(`/menu/categories/${restaurantId}`);
      return response.result;
    } catch (error) {
      console.error("Get menu categories error:", error);
      throw error;
    }
  },

  async getMenuItem(itemId: string) {
    try {
      const response = await apiService.get(`/menu/item/${itemId}`);
      return response.result;
    } catch (error) {
      console.error("Get menu item error:", error);
      throw error;
    }
  },

  async createMenuItem(menuItemData: MenuItemData) {
    try {
      const response = await apiService.post("/menu/item", menuItemData);
      return response.result;
    } catch (error) {
      console.error("Create menu item error:", error);
      throw error;
    }
  },

  async updateMenuItem(itemId: string, updateData: Partial<MenuItemData>) {
    try {
      const response = await apiService.put(`/menu/item/${itemId}`, updateData);
      return response.result;
    } catch (error) {
      console.error("Update menu item error:", error);
      throw error;
    }
  },

  async deleteMenuItem(itemId: string) {
    try {
      const response = await apiService.delete(`/menu/item/${itemId}`);
      return response.result;
    } catch (error) {
      console.error("Delete menu item error:", error);
      throw error;
    }
  },

  async updateMenuItemAvailability(itemId: string, isAvailable: boolean) {
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

  async uploadMenuItemImage(itemId: string, imageUri: string) {
    try {
      const formData = new FormData();

      // Parse filename from URI
      const filename = imageUri.split("/").pop();

      // Determine MIME type
      const match = /\.(\w+)$/.exec(filename || "");
      const type = match ? `image/${match[1]}` : "image/jpeg";

      // @ts-ignore - React Native's FormData implementation differs from standard
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

  async batchUpdateMenuItems(
    items: { id: string; updates: Partial<MenuItemData> }[]
  ) {
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

  async createMenuCategory(categoryData: MenuCategoryData) {
    try {
      const response = await apiService.post("/menu/category", categoryData);
      return response.result;
    } catch (error) {
      console.error("Create menu category error:", error);
      throw error;
    }
  },

  async updateMenuCategory(
    categoryId: string,
    updateData: Partial<MenuCategoryData>
  ) {
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

  async deleteMenuCategory(categoryId: string) {
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
