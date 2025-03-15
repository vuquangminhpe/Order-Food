import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Animated,
  Easing,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import LottieView from "lottie-react-native";
import { useTheme } from "../contexts/ThemeContext";
import { orderService } from "../api/orderService";

const OrderConfirmationScreen = ({ route, navigation }: any) => {
  const { orderId, total } = route.params;
  const { theme } = useTheme();

  interface Order {
    orderNumber: string;
    created_at: string;
    estimatedDeliveryTime?: number;
    paymentMethod: number;
    total: number;
  }

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const fadeAnimation = new Animated.Value(0);
  const slideAnimation = new Animated.Value(100);

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        if (orderId) {
          const orderData = await orderService.getOrderById(orderId);
          setOrder(orderData);
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError(
          "Failed to load order details. Please check your orders history."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

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

  // Estimated delivery time (example calculation)
  const getEstimatedDeliveryTime = () => {
    if (!order) return "30-45 minutes";

    const estimatedMinutes = order.estimatedDeliveryTime || 30;
    const now = new Date();
    const estimatedTime = new Date(now.getTime() + estimatedMinutes * 60000);

    return estimatedTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format date for display
  const formatDate = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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
          Finalizing your order...
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
        {/* Success animation */}
        <View style={styles.animationContainer}>
          <LottieView
            source={require("../assets/animations/order-success.json")}
            autoPlay
            loop={false}
            style={styles.successAnimation}
          />
        </View>

        {/* Order success message */}
        <Animated.View
          style={[
            styles.successContainer,
            {
              opacity: fadeAnimation,
              transform: [{ translateY: slideAnimation }],
            },
          ]}
        >
          <Text style={[styles.successTitle, { color: theme.colors.text }]}>
            Order Placed Successfully!
          </Text>
          <Text
            style={[styles.successMessage, { color: theme.colors.darkGray }]}
          >
            Your order has been received and is being processed. You can track
            the status of your order below.
          </Text>
        </Animated.View>

        {/* Order details */}
        <Animated.View
          style={[
            styles.orderDetailsCard,
            {
              backgroundColor: theme.colors.card,
              opacity: fadeAnimation,
              transform: [{ translateY: slideAnimation }],
            },
          ]}
        >
          <View style={styles.orderInfoRow}>
            <Text
              style={[styles.orderInfoLabel, { color: theme.colors.darkGray }]}
            >
              Order Number
            </Text>
            <Text style={[styles.orderInfoValue, { color: theme.colors.text }]}>
              {order?.orderNumber || `#${orderId.slice(0, 8)}`}
            </Text>
          </View>

          <View style={styles.orderInfoRow}>
            <Text
              style={[styles.orderInfoLabel, { color: theme.colors.darkGray }]}
            >
              Date
            </Text>
            <Text style={[styles.orderInfoValue, { color: theme.colors.text }]}>
              {order
                ? formatDate(order.created_at)
                : new Date().toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.orderInfoRow}>
            <Text
              style={[styles.orderInfoLabel, { color: theme.colors.darkGray }]}
            >
              Estimated Delivery
            </Text>
            <Text style={[styles.orderInfoValue, { color: theme.colors.text }]}>
              {getEstimatedDeliveryTime()}
            </Text>
          </View>

          <View style={styles.orderInfoRow}>
            <Text
              style={[styles.orderInfoLabel, { color: theme.colors.darkGray }]}
            >
              Payment Method
            </Text>
            <Text style={[styles.orderInfoValue, { color: theme.colors.text }]}>
              {order?.paymentMethod === 0
                ? "Cash on Delivery"
                : "Online Payment"}
            </Text>
          </View>

          <View style={[styles.orderInfoRow, styles.lastRow]}>
            <Text
              style={[styles.orderInfoLabel, { color: theme.colors.darkGray }]}
            >
              Total Amount
            </Text>
            <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
              ${order?.total?.toFixed(2) || total?.toFixed(2) || "0.00"}
            </Text>
          </View>
        </Animated.View>

        {/* Action buttons */}
        <Animated.View
          style={[
            styles.actionsContainer,
            {
              opacity: fadeAnimation,
              transform: [{ translateY: slideAnimation }],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.trackButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => navigation.navigate("OrderTracking", { orderId })}
          >
            <Icon name="map-marker-path" size={20} color={theme.colors.white} />
            <Text style={[styles.buttonText, { color: theme.colors.white }]}>
              Track Order
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.viewDetailsButton,
              { borderColor: theme.colors.primary },
            ]}
            onPress={() => navigation.navigate("OrderDetails", { id: orderId })}
          >
            <Text
              style={[styles.viewDetailsText, { color: theme.colors.primary }]}
            >
              View Order Details
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={[styles.homeButtonText, { color: theme.colors.text }]}>
              Back to Home
            </Text>
          </TouchableOpacity>
        </Animated.View>

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
    padding: 16,
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
    marginVertical: 20,
  },
  successAnimation: {
    width: 200,
    height: 200,
  },
  successContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  orderDetailsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  orderInfoLabel: {
    fontSize: 14,
  },
  orderInfoValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  actionsContainer: {
    alignItems: "center",
  },
  trackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 56,
    borderRadius: 28,
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  viewDetailsButton: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  viewDetailsText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  homeButton: {
    padding: 12,
  },
  homeButtonText: {
    fontSize: 14,
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
});

export default OrderConfirmationScreen;
