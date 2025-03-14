import apiService from "./apiService";

export const paymentService = {
  // Create payment URL for VNPay
  async createPaymentUrl(paymentData) {
    try {
      const response = await apiService.post("/payments/create-payment-url", {
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        orderInfo:
          paymentData.orderInfo || `Payment for order ${paymentData.orderId}`,
      });
      return response.result;
    } catch (error) {
      console.error("Create payment URL error:", error);
      throw error;
    }
  },

  // Generate QR code for payment
  async generateQrCode(paymentData) {
    try {
      const response = await apiService.post("/payments/generate-qr", {
        orderId: paymentData.orderId,
        amount: paymentData.amount,
      });
      return response.result;
    } catch (error) {
      console.error("Generate QR code error:", error);
      throw error;
    }
  },

  // Process payment return (after payment gateway redirect)
  async processPaymentReturn(queryParams) {
    try {
      const queryString = new URLSearchParams(queryParams).toString();
      const response = await apiService.get(
        `/payments/vnpay-return?${queryString}`
      );
      return response;
    } catch (error) {
      console.error("Process payment return error:", error);
      throw error;
    }
  },

  // Request refund
  async requestRefund(refundData) {
    try {
      const response = await apiService.post("/payments/refund", {
        orderId: refundData.orderId,
        amount: refundData.amount,
        reason: refundData.reason,
      });
      return response.result;
    } catch (error) {
      console.error("Request refund error:", error);
      throw error;
    }
  },

  // Get payment history
  async getPaymentHistory(page = 1, limit = 10) {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
      }).toString();

      const response = await apiService.get(`/payments/history?${queryParams}`);
      return response.result;
    } catch (error) {
      console.error("Get payment history error:", error);
      throw error;
    }
  },
};

export default paymentService;
