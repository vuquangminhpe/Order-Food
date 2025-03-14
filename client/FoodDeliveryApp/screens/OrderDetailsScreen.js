import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Share,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../contexts/ThemeContext";
import { orderService, OrderStatus } from "../api/orderService";
import {
  getStatusName,
  getStatusIcon,
  getStatusColor,
} from "../utils/orderUtils";
import PriceBreakdown from "../components/cart/PriceBreakdown";
import OrderStatusBadge from "../components/order/OrderStatusBadge";

const OrderDetailsScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const { theme } = useTheme();

  // State
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load order data
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const orderData = await orderService.getOrderById(orderId);
        setOrder(orderData);
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError("Failed to load order details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  // Reorder the same items
  const handleReorder = () => {
    if (!order) return;

    // TODO: Add to cart logic would go here
    Alert.alert(
      "Reorder Items",
      "Would you like to add these items to your cart?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add to Cart",
          onPress: () => {
            // Logic to add items to cart
            navigation.navigate("Cart");
          },
        },
      ]
    );
  };

  // Track order
  const handleTrackOrder = () => {
    navigation.navigate("OrderTracking", { orderId });
  };

  // Cancel order
  const handleCancelOrder = async () => {
    if (!order) return;

    // Only allow cancelling pending or confirmed orders
    if (order.orderStatus > OrderStatus.Confirmed) {
      Alert.alert(
        "Cannot Cancel",
        "This order can no longer be cancelled as it is already being prepared or out for delivery."
      );
      return;
    }

    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await orderService.cancelOrder(
              orderId,
              "Customer requested cancellation"
            );

            // Refresh order data
            const updatedOrder = await orderService.getOrderById(orderId);
            setOrder(updatedOrder);

            Alert.alert(
              "Order Cancelled",
              "Your order has been successfully cancelled."
            );
          } catch (err) {
            console.error("Failed to cancel order:", err);
            Alert.alert("Error", "Failed to cancel order. Please try again.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // Rate order
  const handleRateOrder = () => {
    if (!order) return;

    // Only allow rating delivered orders
    if (order.orderStatus !== OrderStatus.Delivered) {
      Alert.alert(
        "Cannot Rate Yet",
        "You can rate this order once it has been delivered."
      );
      return;
    }

    navigation.navigate("RateOrder", { orderId });
  };

  // Request refund
  const handleRequestRefund = () => {
    if (!order) return;

    // Only allow refunds for delivered/cancelled/rejected orders
    if (
      ![
        OrderStatus.Delivered,
        OrderStatus.Cancelled,
        OrderStatus.Rejected,
      ].includes(order.orderStatus)
    ) {
      Alert.alert(
        "Cannot Request Refund",
        "Refunds can only be requested for delivered, cancelled, or rejected orders."
      );
      return;
    }

    // In a real app, would navigate to refund request form
    Alert.alert(
      "Request Refund",
      "Please contact our customer support to request a refund for this order."
    );
  };

  // Share order details
  const handleShareOrder = async () => {
    if (!order) return;

    try {
      await Share.share({
        message: `I ordered from ${
          order.restaurant?.name || "a restaurant"
        } on Food Delivery App!\nOrder #: ${
          order.orderNumber
        }\nStatus: ${getStatusName(
          order.orderStatus
        )}\nTotal: $${order.total.toFixed(2)}`,
      });
    } catch (err) {
      console.error("Error sharing order:", err);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Render order details
  const renderOrderDetails = () => {
    if (!order) return null;

    return (
      <View style={styles.orderDetailsContainer}>
        <View style={styles.orderHeader}>
          <View>
            <Text
              style={[
                styles.orderNumberLabel,
                { color: theme.colors.darkGray },
              ]}
            >
              Order Number
            </Text>
            <Text style={[styles.orderNumber, { color: theme.colors.text }]}>
              #{order.orderNumber}
            </Text>
          </View>

          <OrderStatusBadge status={order.orderStatus} />
        </View>

        <View style={styles.dateContainer}>
          <Icon name="calendar" size={16} color={theme.colors.darkGray} />
          <Text style={[styles.dateText, { color: theme.colors.text }]}>
            Placed on {formatDate(order.created_at)}
          </Text>
        </View>

        {/* Restaurant Info */}
        <View
          style={[
            styles.restaurantContainer,
            { borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Restaurant
          </Text>
          <Text style={[styles.restaurantName, { color: theme.colors.text }]}>
            {order.restaurant?.name || "Restaurant Name"}
          </Text>

          <TouchableOpacity
            style={styles.viewRestaurantButton}
            onPress={() => {
              // Navigate to restaurant details
              if (order.restaurantId) {
                navigation.navigate("Restaurant", {
                  id: order.restaurantId.toString(),
                  name: order.restaurant?.name,
                });
              }
            }}
          >
            <Text
              style={[
                styles.viewRestaurantText,
                { color: theme.colors.primary },
              ]}
            >
              View Restaurant
            </Text>
            <Icon name="chevron-right" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Order Items */}
        <View style={styles.itemsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Order Items
          </Text>

          {order.items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemDetails}>
                <Text
                  style={[styles.itemQuantity, { color: theme.colors.primary }]}
                >
                  {item.quantity}x
                </Text>
                <View style={styles.itemNameContainer}>
                  <Text style={[styles.itemName, { color: theme.colors.text }]}>
                    {item.name}
                  </Text>

                  {/* Item options if any */}
                  {item.options && item.options.length > 0 && (
                    <Text
                      style={[
                        styles.itemOptions,
                        { color: theme.colors.darkGray },
                      ]}
                    >
                      {item.options
                        .map(
                          (option) =>
                            `${option.title}: ${option.items
                              .map((i) => i.name)
                              .join(", ")}`
                        )
                        .join(" | ")}
                    </Text>
                  )}
                </View>
              </View>

              <Text style={[styles.itemPrice, { color: theme.colors.text }]}>
                ${item.totalPrice.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Price Breakdown */}
        <View style={styles.priceContainer}>
          <PriceBreakdown
            subtotal={order.subtotal}
            deliveryFee={order.deliveryFee}
            serviceCharge={order.serviceCharge}
            discount={order.discount}
            total={order.total}
          />
        </View>

        {/* Delivery Info */}
        <View
          style={[
            styles.deliveryContainer,
            { borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Delivery Information
          </Text>

          <View style={styles.deliveryRow}>
            <Icon name="map-marker" size={16} color={theme.colors.darkGray} />
            <Text
              style={[styles.deliveryAddress, { color: theme.colors.text }]}
            >
              {order.deliveryAddress.address}
            </Text>
          </View>

          {order.deliveryPersonId && (
            <View style={styles.deliveryRow}>
              <Icon name="account" size={16} color={theme.colors.darkGray} />
              <Text
                style={[styles.deliveryPerson, { color: theme.colors.text }]}
              >
                Delivered by {order.deliveryPerson?.name || "Delivery Person"}
              </Text>
            </View>
          )}

          {order.scheduledFor && (
            <View style={styles.deliveryRow}>
              <Icon name="clock" size={16} color={theme.colors.darkGray} />
              <Text
                style={[styles.scheduledTime, { color: theme.colors.text }]}
              >
                Scheduled for {formatDate(order.scheduledFor)}
              </Text>
            </View>
          )}
        </View>

        {/* Payment Info */}
        <View style={styles.paymentContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Payment Information
          </Text>

          <View style={styles.paymentRow}>
            <Icon
              name={order.paymentMethod === 0 ? "cash" : "credit-card"}
              size={16}
              color={theme.colors.darkGray}
            />
            <Text style={[styles.paymentMethod, { color: theme.colors.text }]}>
              {order.paymentMethod === 0
                ? "Cash on Delivery"
                : "Online Payment"}
            </Text>
          </View>

          <View style={styles.paymentRow}>
            <Icon
              name={
                order.paymentStatus === 0
                  ? "clock-outline"
                  : order.paymentStatus === 1
                  ? "check-circle"
                  : "alert-circle"
              }
              size={16}
              color={
                order.paymentStatus === 0
                  ? theme.colors.warning
                  : order.paymentStatus === 1
                  ? theme.colors.success
                  : theme.colors.error
              }
            />
            <Text
              style={[
                styles.paymentStatus,
                {
                  color:
                    order.paymentStatus === 0
                      ? theme.colors.warning
                      : order.paymentStatus === 1
                      ? theme.colors.success
                      : theme.colors.error,
                },
              ]}
            >
              {order.paymentStatus === 0
                ? "Payment Pending"
                : order.paymentStatus === 1
                ? "Payment Completed"
                : "Payment Failed"}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {order.notes && (
          <View style={styles.notesContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Order Notes
            </Text>
            <Text style={[styles.notesText, { color: theme.colors.text }]}>
              {order.notes}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {/* Track Order Button (for in-progress orders) */}
          {order.orderStatus > OrderStatus.Confirmed &&
            order.orderStatus < OrderStatus.Delivered && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={handleTrackOrder}
              >
                <Icon name="map-marker-path" size={20} color="#FFF" />
                <Text style={[styles.actionButtonText, { color: "#FFF" }]}>
                  Track Order
                </Text>
              </TouchableOpacity>
            )}

          {/* Cancel Order Button (for pending/confirmed orders) */}
          {order.orderStatus <= OrderStatus.Confirmed && (
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: theme.colors.error }]}
              onPress={handleCancelOrder}
            >
              <Icon name="close-circle" size={20} color={theme.colors.error} />
              <Text
                style={[styles.actionButtonText, { color: theme.colors.error }]}
              >
                Cancel Order
              </Text>
            </TouchableOpacity>
          )}

          {/* Rate Order Button (for delivered orders) */}
          {order.orderStatus === OrderStatus.Delivered && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.secondary },
              ]}
              onPress={handleRateOrder}
            >
              <Icon name="star" size={20} color="#FFF" />
              <Text style={[styles.actionButtonText, { color: "#FFF" }]}>
                Rate Order
              </Text>
            </TouchableOpacity>
          )}

          {/* Request Refund Button (for applicable orders) */}
          {[
            OrderStatus.Delivered,
            OrderStatus.Cancelled,
            OrderStatus.Rejected,
          ].includes(order.orderStatus) && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { borderColor: theme.colors.primary },
              ]}
              onPress={handleRequestRefund}
            >
              <Icon name="cash-refund" size={20} color={theme.colors.primary} />
              <Text
                style={[
                  styles.actionButtonText,
                  { color: theme.colors.primary },
                ]}
              >
                Request Refund
              </Text>
            </TouchableOpacity>
          )}

          {/* Reorder Button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor:
                  order.orderStatus === OrderStatus.Delivered
                    ? theme.colors.primary
                    : theme.colors.gray,
              },
            ]}
            onPress={handleReorder}
            disabled={order.orderStatus !== OrderStatus.Delivered}
          >
            <Icon
              name="refresh"
              size={20}
              color={
                order.orderStatus === OrderStatus.Delivered
                  ? "#FFF"
                  : theme.colors.darkGray
              }
            />
            <Text
              style={[
                styles.actionButtonText,
                {
                  color:
                    order.orderStatus === OrderStatus.Delivered
                      ? "#FFF"
                      : theme.colors.darkGray,
                },
              ]}
            >
              Reorder
            </Text>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              { borderColor: theme.colors.darkGray },
            ]}
            onPress={handleShareOrder}
          >
            <Icon
              name="share-variant"
              size={20}
              color={theme.colors.darkGray}
            />
            <Text
              style={[
                styles.actionButtonText,
                { color: theme.colors.darkGray },
              ]}
            >
              Share Order
            </Text>
          </TouchableOpacity>
        </View>

        {/* Spacer at bottom */}
        <View style={{ height: 20 }} />
      </View>
    );
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
          Loading order details...
        </Text>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Icon name="alert-circle" size={60} color={theme.colors.error} />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[
            styles.retryButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.retryButtonText, { color: theme.colors.white }]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {renderOrderDetails()}
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  orderDetailsContainer: {
    padding: 16,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderNumberLabel: {
    fontSize: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dateText: {
    fontSize: 14,
    marginLeft: 8,
  },
  restaurantContainer: {
    marginBottom: 20,
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  viewRestaurantButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewRestaurantText: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 4,
  },
  itemsContainer: {
    marginBottom: 20,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  itemDetails: {
    flexDirection: "row",
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 8,
    width: 28,
  },
  itemNameContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
  },
  itemOptions: {
    fontSize: 12,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "500",
  },
  priceContainer: {
    marginBottom: 20,
  },
  deliveryContainer: {
    marginBottom: 20,
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  deliveryAddress: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  deliveryPerson: {
    fontSize: 14,
    marginLeft: 8,
  },
  scheduledTime: {
    fontSize: 14,
    marginLeft: 8,
  },
  paymentContainer: {
    marginBottom: 20,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  paymentMethod: {
    fontSize: 14,
    marginLeft: 8,
  },
  paymentStatus: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: "500",
  },
  notesContainer: {
    marginBottom: 20,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsContainer: {
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
});

export default OrderDetailsScreen;
