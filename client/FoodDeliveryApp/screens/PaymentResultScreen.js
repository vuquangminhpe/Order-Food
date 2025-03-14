import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Animated,
  Easing,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../contexts/ThemeContext";
import { useCart } from "../contexts/CartContext";
import { paymentService } from "../api/paymentService";
import { orderService } from "../api/orderService";
import LottieView from "lottie-react-native";

const PaymentResultScreen = ({ route, navigation }) => {
  const { orderId, paymentUrl, status } = route.params || {};
  const { theme } = useTheme();
  const { clearCart } = useCart();

  // State
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(status || null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [error, setError] = useState(null);

  // Animation values
  const fadeAnimation = new Animated.Value(0);
  const slideAnimation = new Animated.Value(50);

  // Process payment result
  useEffect(() => {
    const processPayment = async () => {
      try {
        setLoading(true);

        // If status is already provided (e.g., from WebView navigation)
        if (status) {
          setPaymentStatus(status);
        }
        // Otherwise, query payment status from the server
        else if (orderId) {
          // In a real app, you would query the payment status
          // Here we'll simulate a server response
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Randomly determine success or failure for demo purposes
          const isSuccess = Math.random() > 0.3;
          setPaymentStatus(isSuccess ? "success" : "failure");
        }

        // Fetch order details if orderId is available
        if (orderId) {
          const orderData = await orderService.getOrderById(orderId);
          setOrderDetails(orderData);
        }

        // Clear cart after payment (whether successful or not)
        clearCart();
      } catch (err) {
        console.error("Payment processing error:", err);
        setError(
          "Failed to process payment result. Please contact customer support."
        );
        setPaymentStatus("error");
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, [orderId, status]);

  // Start animations when loaded
  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  // Format currency
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // Handle "View Order" button
  const handleViewOrder = () => {
    navigation.navigate("OrderDetails", { orderId });
  };

  // Handle "Return to Home" button
  const handleReturnHome = () => {
    navigation.navigate("Home");
  };

  // Render loading state
  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Processing payment...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Payment Result Animation */}
        <View style={styles.animationContainer}>
          {paymentStatus === "success" ? (
            <LottieView
              source={require("../assets/animations/payment-success.json")}
              style={styles.animation}
              autoPlay
              loop={false}
            />
          ) : (
            <LottieView
              source={require("../assets/animations/payment-failed.json")}
              style={styles.animation}
              autoPlay
              loop={false}
            />
          )}
        </View>

        {/* Payment Result Message */}
        <Animated.View
          style={[
            styles.resultContainer,
            {
              opacity: fadeAnimation,
              transform: [{ translateY: slideAnimation }],
            },
          ]}
        >
          <Text
            style={[
              styles.resultTitle,
              {
                color:
                  paymentStatus === "success"
                    ? theme.colors.success
                    : theme.colors.error,
              },
            ]}
          >
            {paymentStatus === "success"
              ? "Payment Successful!"
              : "Payment Failed"}
          </Text>

          <Text
            style={[styles.resultMessage, { color: theme.colors.darkGray }]}
          >
            {paymentStatus === "success"
              ? "Your payment was processed successfully. Your order is now being prepared."
              : "There was an issue processing your payment. Please try again or choose a different payment method."}
          </Text>

          {orderDetails && (
            <View
              style={[
                styles.orderSummaryCard,
                { backgroundColor: theme.colors.card },
              ]}
            >
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                Order Summary
              </Text>

              <View style={styles.orderInfoRow}>
                <Text
                  style={[
                    styles.orderInfoLabel,
                    { color: theme.colors.darkGray },
                  ]}
                >
                  Order Number
                </Text>
                <Text
                  style={[styles.orderInfoValue, { color: theme.colors.text }]}
                >
                  {orderDetails.orderNumber || `#${orderId.slice(0, 8)}`}
                </Text>
              </View>

              {orderDetails.restaurant && (
                <View style={styles.orderInfoRow}>
                  <Text
                    style={[
                      styles.orderInfoLabel,
                      { color: theme.colors.darkGray },
                    ]}
                  >
                    Restaurant
                  </Text>
                  <Text
                    style={[
                      styles.orderInfoValue,
                      { color: theme.colors.text },
                    ]}
                  >
                    {orderDetails.restaurant.name}
                  </Text>
                </View>
              )}

              <View style={styles.orderInfoRow}>
                <Text
                  style={[
                    styles.orderInfoLabel,
                    { color: theme.colors.darkGray },
                  ]}
                >
                  Items
                </Text>
                <Text
                  style={[styles.orderInfoValue, { color: theme.colors.text }]}
                >
                  {orderDetails.items?.length || 0} items
                </Text>
              </View>

              <View
                style={[
                  styles.totalRow,
                  { borderTopColor: theme.colors.border },
                ]}
              >
                <Text
                  style={[styles.totalLabel, { color: theme.colors.darkGray }]}
                >
                  Total
                </Text>
                <Text
                  style={[styles.totalValue, { color: theme.colors.primary }]}
                >
                  {formatCurrency(orderDetails.total || 0)}
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View
          style={[
            styles.actionsContainer,
            {
              opacity: fadeAnimation,
              transform: [{ translateY: slideAnimation }],
            },
          ]}
        >
          {paymentStatus === "success" && (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleViewOrder}
            >
              <Icon name="receipt" size={20} color={theme.colors.white} />
              <Text
                style={[
                  styles.primaryButtonText,
                  { color: theme.colors.white },
                ]}
              >
                View Order
              </Text>
            </TouchableOpacity>
          )}

          {paymentStatus !== "success" && (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => navigation.navigate("Checkout")}
            >
              <Icon name="refresh" size={20} color={theme.colors.white} />
              <Text
                style={[
                  styles.primaryButtonText,
                  { color: theme.colors.white },
                ]}
              >
                Try Again
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { borderColor: theme.colors.primary },
            ]}
            onPress={handleReturnHome}
          >
            <Icon name="home" size={20} color={theme.colors.primary} />
            <Text
              style={[
                styles.secondaryButtonText,
                { color: theme.colors.primary },
              ]}
            >
              Return to Home
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Payment ID */}
        {orderId && (
          <Text style={[styles.paymentId, { color: theme.colors.darkGray }]}>
            Payment ID: {orderId.slice(0, 8)}
          </Text>
        )}

        {/* Error message if any */}
        {error && (
          <View
            style={[
              styles.errorContainer,
              { backgroundColor: "rgba(255,0,0,0.1)" },
            ]}
          >
            <Icon name="alert-circle" size={20} color={theme.colors.error} />
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  animationContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    height: 200,
  },
  animation: {
    width: 200,
    height: 200,
  },
  resultContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  resultMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  orderSummaryCard: {
    width: "100%",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  orderInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  orderInfoLabel: {
    fontSize: 14,
  },
  orderInfoValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  actionsContainer: {
    marginTop: 20,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 56,
    borderRadius: 28,
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 16,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  paymentId: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
});

export default PaymentResultScreen;
