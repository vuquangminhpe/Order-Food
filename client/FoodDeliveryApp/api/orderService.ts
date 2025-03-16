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
interface OrderItemOption {
  title: string;
  items: {
    name: string;
    price: number;
  }[];
}

interface OrderItem {
  menuItemId: string;
  quantity: number;
  options?: OrderItemOption[];
}

interface OrderAddress {
  address: string;
  lat: number;
  lng: number;
}

interface OrderData {
  restaurantId: string;
  items: OrderItem[];
  deliveryAddress: OrderAddress;
  paymentMethod: number;
  notes?: string;
  serviceCharge?: number;
  discount?: number;
}

interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: number;
  sortBy?: string;
  sortOrder?: string;
}

export const orderService = {
  async createOrder(orderData: OrderData) {
    try {
      const response = await apiService.post("/orders", orderData);
      return response.result;
    } catch (error) {
      console.error("Create order error:", error);
      throw error;
    }
  },

  async getOrderById(orderId: string) {
    try {
      const response = await apiService.get(`/orders/${orderId}`);
      return response.result;
    } catch (error) {
      console.error("Get order by ID error:", error);
      throw error;
    }
  },

  async getUserOrders(params: OrderQueryParams = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        sortBy = "created_at",
        sortOrder = "desc",
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        ...(status !== undefined && { status: status.toString() }),
      }).toString();

      const response = await apiService.get(`/orders/user?${queryParams}`);
      return response.result;
    } catch (error) {
      console.error("Get user orders error:", error);
      throw error;
    }
  },

  async updateOrderStatus(orderId: string, status: number, reason?: string) {
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

  async cancelOrder(orderId: string, reason: string) {
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

  async rateOrder(
    orderId: string,
    rating: number,
    review: string,
    foodRating: number,
    deliveryRating: number
  ) {
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

  async getOrderTracking(orderId: string) {
    try {
      const response = await apiService.get(`/orders/${orderId}/tracking`);
      return response.result;
    } catch (error) {
      console.error("Get order tracking error:", error);
      throw error;
    }
  },

  async assignDeliveryPerson(orderId: string, deliveryPersonId: string) {
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

  async updateDeliveryLocation(orderId: string, lat: number, lng: number) {
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

  async getActiveDeliveryOrders() {
    try {
      const response = await apiService.get("/orders/delivery/active");
      return response.result;
    } catch (error) {
      console.error("Get active delivery orders error:", error);
      throw error;
    }
  },

  async getDeliveryHistory(
    params: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    } = {}
  ) {
    try {
      const { page = 1, limit = 10, startDate, endDate } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
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

  async searchOrders(
    params: {
      query?: string;
      page?: number;
      limit?: number;
      status?: number;
      paymentStatus?: number;
      startDate?: string;
      endDate?: string;
      sortBy?: string;
      sortOrder?: string;
      restaurantId?: string;
      userId?: string;
      deliveryPersonId?: string;
      minAmount?: number;
      maxAmount?: number;
    } = {}
  ) {
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
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        ...(query && { query }),
        ...(status !== undefined && { status: status.toString() }),
        ...(paymentStatus !== undefined && {
          paymentStatus: paymentStatus.toString(),
        }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(restaurantId && { restaurantId }),
        ...(userId && { userId }),
        ...(deliveryPersonId && { deliveryPersonId }),
        ...(minAmount !== undefined && { minAmount: String(minAmount) }),
        ...(maxAmount !== undefined && { maxAmount: String(maxAmount) }),
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
