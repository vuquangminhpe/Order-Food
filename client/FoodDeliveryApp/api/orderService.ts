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

      // Create a URLSearchParams object explicitly instead of using object spread
      const queryParams = new URLSearchParams();

      // Add basic pagination and sorting params
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
      queryParams.append("sortBy", sortBy);
      queryParams.append("sortOrder", sortOrder);

      // Add optional filtering params with explicit naming
      if (query) queryParams.append("query", query);

      // Use statusFilter instead of status to avoid MongoDB ObjectId validation
      if (status !== undefined)
        queryParams.append("statusFilter", status.toString());

      if (paymentStatus !== undefined)
        queryParams.append("paymentStatus", paymentStatus.toString());
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);

      // Be careful with ID parameters
      if (restaurantId) queryParams.append("restaurantId", restaurantId);
      if (userId) queryParams.append("userId", userId);
      if (deliveryPersonId)
        queryParams.append("deliveryPersonId", deliveryPersonId);

      // Add amount filters
      if (minAmount !== undefined)
        queryParams.append("minAmount", minAmount.toString());
      if (maxAmount !== undefined)
        queryParams.append("maxAmount", maxAmount.toString());

      // Debug logging
      console.log("Search orders URL parameters:", queryParams.toString());

      // Make the API request
      const response = await apiService.get(
        `/orders/search?${queryParams.toString()}`
      );
      return response.result;
    } catch (error) {
      console.error("Search orders error:", error);
      throw error;
    }
  },
};

export default orderService;
