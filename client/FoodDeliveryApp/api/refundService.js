import apiService from "./apiService";

export const refundService = {
  // Create a new refund request
  async createRefundRequest(orderId, amount, reason, method) {
    try {
      const response = await apiService.post("/refunds", {
        orderId,
        amount,
        reason,
        method,
      });
      return response.result;
    } catch (error) {
      console.error("Create refund request error:", error);
      throw error;
    }
  },

  // Get refund by ID
  async getRefundById(refundId) {
    try {
      const response = await apiService.get(`/refunds/${refundId}`);
      return response.result;
    } catch (error) {
      console.error("Get refund by ID error:", error);
      throw error;
    }
  },

  // Get refunds for an order
  async getRefundsByOrderId(orderId) {
    try {
      const response = await apiService.get(`/refunds/order/${orderId}`);
      return response.result;
    } catch (error) {
      console.error("Get refunds by order ID error:", error);
      throw error;
    }
  },

  // Get user's refund history
  async getUserRefunds(page = 1, limit = 10) {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
      }).toString();

      const response = await apiService.get(
        `/refunds/user/history?${queryParams}`
      );
      return response.result;
    } catch (error) {
      console.error("Get user refunds error:", error);
      throw error;
    }
  },

  // Approve refund (for restaurant owners)
  async approveRefund(refundId, notes) {
    try {
      const response = await apiService.post(`/refunds/${refundId}/approve`, {
        notes,
      });
      return response.result;
    } catch (error) {
      console.error("Approve refund error:", error);
      throw error;
    }
  },

  // Reject refund (for restaurant owners)
  async rejectRefund(refundId, reason) {
    try {
      const response = await apiService.post(`/refunds/${refundId}/reject`, {
        reason,
      });
      return response.result;
    } catch (error) {
      console.error("Reject refund error:", error);
      throw error;
    }
  },
};

export default refundService;
