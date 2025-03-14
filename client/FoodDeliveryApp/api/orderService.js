import apiService from "./apiService";

// Order status constants
export const OrderStatus = {
  Pending: 0,
  Confirmed: 1,
  Preparing: 2,
  ReadyForPickup: 3,
  OutForDelivery: 4,
  Delivered: 5,
  Cancelled: 6,
  Rejected: 7,
};

// Payment method constants
export const PaymentMethod = {
  CashOnDelivery: 0,
  VNPay: 1,
};

export const orderService = {
  // Create a new order
  async createOrder(orderData) {
    try {
      const response = await apiService.post("/orders", orderData);
      return response.result;
    } catch (error) {
      console.error("Create order error:", error);
      throw error;
    }
  },

  // Get order by ID
  async getOrderById(orderId) {
    try {
      const response = await apiService.get(`/orders/${orderId}`);
      return response.result;
    } catch (error) {
      console.error("Get order by ID error:", error);
      throw error;
    }
  },

  // Get user's orders
  async getUserOrders(params = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        sortBy = "created_at",
        sortOrder = "desc",
      } = params;

      const queryParams = new URLSearchParams({
        page,
        limit,
        sortBy,
        sortOrder,
        ...(status !== undefined && { status }),
      }).toString();

      const response = await apiService.get(`/orders/user?${queryParams}`);
      return response.result;
    } catch (error) {
      console.error("Get user orders error:", error);
      throw error;
    }
  },

  // Update order status (for restaurant owners)
  async updateOrderStatus(orderId, status, reason) {
    try {
      const response = await apiService.patch(`/orders/${orderId}/status`, {
        status,
        reason,
      });
      return response.result;
    } catch (error) {
      console.error("Update order status error:", error);
      throw error;
    }
  },

  // Cancel order (for customers)
  async cancelOrder(orderId, reason) {
    try {
      const response = await apiService.post(`/orders/${orderId}/cancel`, {
        reason,
      });
      return response.result;
    } catch (error) {
      console.error("Cancel order error:", error);
      throw error;
    }
  },

  // Rate order (for customers)
  async rateOrder(orderId, rating, review, foodRating, deliveryRating) {
    try {
      const response = await apiService.post(`/orders/${orderId}/rate`, {
        rating,
        review,
        foodRating,
        deliveryRating,
      });
      return response.result;
    } catch (error) {
      console.error("Rate order error:", error);
      throw error;
    }
  },

  // Get order tracking information
  async getOrderTracking(orderId) {
    try {
      const response = await apiService.get(`/orders/${orderId}/tracking`);
      return response.result;
    } catch (error) {
      console.error("Get order tracking error:", error);
      throw error;
    }
  },

  // Assign delivery person to order (for restaurant owners)
  async assignDeliveryPerson(orderId, deliveryPersonId) {
    try {
      const response = await apiService.post(`/orders/${orderId}/assign`, {
        deliveryPersonId,
      });
      return response.result;
    } catch (error) {
      console.error("Assign delivery person error:", error);
      throw error;
    }
  },

  // Update delivery location (for delivery personnel)
  async updateDeliveryLocation(orderId, lat, lng) {
    try {
      const response = await apiService.post(
        `/orders/${orderId}/delivery-location`,
        {
          lat,
          lng,
        }
      );
      return response.result;
    } catch (error) {
      console.error("Update delivery location error:", error);
      throw error;
    }
  },

  // Get active delivery orders (for delivery personnel)
  async getActiveDeliveryOrders() {
    try {
      const response = await apiService.get("/orders/delivery/active");
      return response.result;
    } catch (error) {
      console.error("Get active delivery orders error:", error);
      throw error;
    }
  },

  // Get delivery history (for delivery personnel)
  async getDeliveryHistory(params = {}) {
    try {
      const { page = 1, limit = 10, startDate, endDate } = params;

      const queryParams = new URLSearchParams({
        page,
        limit,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      }).toString();

      const response = await apiService.get(
        `/orders/delivery/history?${queryParams}`
      );
      return response.result;
    } catch (error) {
      console.error("Get delivery history error:", error);
      throw error;
    }
  },

  // Search orders (for admin)
  async searchOrders(params = {}) {
    try {
      const {
        query,
        page = 1,
        limit = 10,
        status,
        paymentStatus,
        startDate,
        endDate,
        sortBy = "created_at",
        sortOrder = "desc",
        restaurantId,
        userId,
        deliveryPersonId,
        minAmount,
        maxAmount,
      } = params;

      const queryParams = new URLSearchParams({
        page,
        limit,
        sortBy,
        sortOrder,
        ...(query && { query }),
        ...(status !== undefined && { status }),
        ...(paymentStatus !== undefined && { paymentStatus }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(restaurantId && { restaurantId }),
        ...(userId && { userId }),
        ...(deliveryPersonId && { deliveryPersonId }),
        ...(minAmount !== undefined && { minAmount }),
        ...(maxAmount !== undefined && { maxAmount }),
      }).toString();

      const response = await apiService.get(`/orders/search?${queryParams}`);
      return response.result;
    } catch (error) {
      console.error("Search orders error:", error);
      throw error;
    }
  },
};

export default orderService;
