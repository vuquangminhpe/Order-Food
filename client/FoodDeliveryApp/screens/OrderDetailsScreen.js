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
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../contexts/ThemeContext";
import { orderService, OrderStatus } from "../../api/orderService";
import {
  getStatusName,
  getStatusIcon,
  getStatusColor,
  formatOrderDate,
} from "../../utils/orderUtils";

const OrderDetailsScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const { theme } = useTheme();

  // State
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Fetch order details
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

  // Handle status update
  const handleUpdateStatus = (newStatus) => {
    let statusName;
    let confirmationMessage;

    switch (newStatus) {
      case OrderStatus.Confirmed:
        statusName = "Confirm";
        confirmationMessage = "confirm this order";
        break;
      case OrderStatus.Preparing:
        statusName = "Start Preparing";
        confirmationMessage = "start preparing this order";
        break;
      case OrderStatus.ReadyForPickup:
        statusName = "Mark as Ready";
        confirmationMessage = "mark this order as ready for pickup";
        break;
      case OrderStatus.Rejected:
        statusName = "Reject";
        confirmationMessage = "reject this order";
        break;
      default:
        statusName = "Update";
        confirmationMessage = "update the status of this order";
    }

    Alert.alert(
      `${statusName} Order`,
      `Are you sure you want to ${confirmationMessage}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: statusName,
          style: newStatus === OrderStatus.Rejected ? "destructive" : "default",
          onPress: async () => {
            try {
              setProcessing(true);

              // Update order status
              await orderService.updateOrderStatus(orderId, newStatus);

              // Update local state
              setOrder((prevOrder) => ({
                ...prevOrder,
                status: newStatus,
                statusUpdatedAt: new Date().toISOString(),
              }));

              Alert.alert(
                "Success",
                `Order status updated to ${getStatusName(newStatus)}`
              );
            } catch (error) {
              console.error("Update status error:", error);
              Alert.alert("Error", "Failed to update order status");
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  // Handle assign delivery person
  const handleAssignDelivery = () => {
    // In a real app, you would navigate to a screen to select a delivery person
    // or show a modal to pick from available delivery persons
    Alert.alert(
      "Assign Delivery Person",
      "This would open a screen to select a delivery person.",
      [{ text: "OK" }]
    );
  };

  // Get next action for order
  const getNextAction = (order) => {
    if (!order) return null;

    switch (order.status) {
      case OrderStatus.Pending:
        return {
          title: "Confirm Order",
          status: OrderStatus.Confirmed,
          color: theme.colors.info,
        };
      case OrderStatus.Confirmed:
        return {
          title: "Start Preparing",
          status: OrderStatus.Preparing,
          color: theme.colors.secondary,
        };
      case OrderStatus.Preparing:
        return {
          title: "Ready for Pickup",
          status: OrderStatus.ReadyForPickup,
          color: theme.colors.accent,
        };
      default:
        return null;
    }
  };

  // Calculate total items
  const calculateTotalItems = (items) => {
    if (!items || !items.length) return 0;
    return items.reduce((total, item) => total + item.quantity, 0);
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

  // Next action for the order
  const nextAction = getNextAction(order);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {/* Order Status */}
        <View style={styles.statusSection}>
          <View
            style={[
              styles.statusContainer,
              {
                backgroundColor:
                  theme.colors[getStatusColor(order?.status)] + "20",
              },
            ]}
          >
            <Icon
              name={getStatusIcon(order?.status)}
              size={24}
              color={theme.colors[getStatusColor(order?.status)]}
            />
            <Text
              style={[
                styles.statusText,
                { color: theme.colors[getStatusColor(order?.status)] },
              ]}
            >
              {getStatusName(order?.status)}
            </Text>
          </View>

          <Text style={[styles.orderNumber, { color: theme.colors.text }]}>
            Order #{order?.orderNumber}
          </Text>

          <Text style={[styles.orderTime, { color: theme.colors.darkGray }]}>
            Placed on {formatOrderDate(order?.created_at)}
          </Text>
        </View>

        {/* Customer Information */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Customer Information
          </Text>

          <View style={styles.infoRow}>
            <Icon name="account" size={20} color={theme.colors.darkGray} />
            <Text style={[styles.infoLabel, { color: theme.colors.darkGray }]}>
              Name:
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {order?.customer?.name || "Customer"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="phone" size={20} color={theme.colors.darkGray} />
            <Text style={[styles.infoLabel, { color: theme.colors.darkGray }]}>
              Phone:
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {order?.customer?.phone || "Not provided"}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.callButton,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Icon name="phone" size={16} color={theme.colors.white} />
            <Text
              style={[styles.callButtonText, { color: theme.colors.white }]}
            >
              Call Customer
            </Text>
          </TouchableOpacity>
        </View>

        {/* Delivery Address */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Delivery Address
          </Text>

          <View style={styles.infoRow}>
            <Icon name="map-marker" size={20} color={theme.colors.darkGray} />
            <Text style={[styles.addressText, { color: theme.colors.text }]}>
              {order?.deliveryAddress?.address || "No address provided"}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.mapButton, { borderColor: theme.colors.primary }]}
          >
            <Icon name="map" size={16} color={theme.colors.primary} />
            <Text
              style={[styles.mapButtonText, { color: theme.colors.primary }]}
            >
              View on Map
            </Text>
          </TouchableOpacity>
        </View>

        {/* Order Items */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Order Items ({calculateTotalItems(order?.items)})
          </Text>

          {order?.items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemDetails}>
                <Text
                  style={[styles.itemQuantity, { color: theme.colors.primary }]}
                >
                  {item.quantity}x
                </Text>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: theme.colors.text }]}>
                    {item.name}
                  </Text>
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
                <Text style={[styles.itemPrice, { color: theme.colors.text }]}>
                  ${item.totalPrice?.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}

          <View
            style={[styles.divider, { backgroundColor: theme.colors.border }]}
          />

          {/* Order Summary */}
          <View style={styles.orderSummary}>
            <View style={styles.summaryRow}>
              <Text
                style={[styles.summaryLabel, { color: theme.colors.darkGray }]}
              >
                Subtotal
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                ${order?.subtotal?.toFixed(2)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text
                style={[styles.summaryLabel, { color: theme.colors.darkGray }]}
              >
                Delivery Fee
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                ${order?.deliveryFee?.toFixed(2)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text
                style={[styles.summaryLabel, { color: theme.colors.darkGray }]}
              >
                Service Charge
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                ${order?.serviceCharge?.toFixed(2)}
              </Text>
            </View>

            {order?.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text
                  style={[
                    styles.summaryLabel,
                    { color: theme.colors.darkGray },
                  ]}
                >
                  Discount
                </Text>
                <Text
                  style={[
                    styles.discountValue,
                    { color: theme.colors.success },
                  ]}
                >
                  -${order.discount.toFixed(2)}
                </Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.colors.text }]}>
                Total
              </Text>
              <Text
                style={[styles.totalValue, { color: theme.colors.primary }]}
              >
                ${order?.total?.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Information */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Payment Information
          </Text>

          <View style={styles.infoRow}>
            <Icon
              name={order?.paymentMethod === 0 ? "cash" : "credit-card"}
              size={20}
              color={theme.colors.darkGray}
            />
            <Text style={[styles.infoLabel, { color: theme.colors.darkGray }]}>
              Method:
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {order?.paymentMethod === 0
                ? "Cash on Delivery"
                : "Online Payment"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon
              name={
                order?.paymentStatus === 0
                  ? "clock-outline"
                  : order?.paymentStatus === 1
                  ? "check-circle"
                  : "alert-circle"
              }
              size={20}
              color={
                order?.paymentStatus === 0
                  ? theme.colors.warning
                  : order?.paymentStatus === 1
                  ? theme.colors.success
                  : theme.colors.error
              }
            />
            <Text style={[styles.infoLabel, { color: theme.colors.darkGray }]}>
              Status:
            </Text>
            <Text
              style={[
                styles.infoValue,
                {
                  color:
                    order?.paymentStatus === 0
                      ? theme.colors.warning
                      : order?.paymentStatus === 1
                      ? theme.colors.success
                      : theme.colors.error,
                },
              ]}
            >
              {order?.paymentStatus === 0
                ? "Pending"
                : order?.paymentStatus === 1
                ? "Completed"
                : "Failed"}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {order?.notes && (
          <View
            style={[styles.section, { backgroundColor: theme.colors.card }]}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Customer Notes
            </Text>
            <Text style={[styles.notesText, { color: theme.colors.text }]}>
              {order.notes}
            </Text>
          </View>
        )}

        {/* Order Timeline */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Order Timeline
          </Text>

          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View
                style={[
                  styles.timelineDot,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
              <View style={styles.timelineContent}>
                <Text
                  style={[styles.timelineTitle, { color: theme.colors.text }]}
                >
                  Order Received
                </Text>
                <Text
                  style={[
                    styles.timelineTime,
                    { color: theme.colors.darkGray },
                  ]}
                >
                  {formatOrderDate(order?.created_at)}
                </Text>
              </View>
            </View>

            {order?.status >= OrderStatus.Confirmed && (
              <View style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: theme.colors.info },
                  ]}
                />
                <View style={styles.timelineContent}>
                  <Text
                    style={[styles.timelineTitle, { color: theme.colors.text }]}
                  >
                    Order Confirmed
                  </Text>
                  <Text
                    style={[
                      styles.timelineTime,
                      { color: theme.colors.darkGray },
                    ]}
                  >
                    {formatOrderDate(
                      order?.confirmedAt || order?.statusUpdatedAt
                    )}
                  </Text>
                </View>
              </View>
            )}

            {order?.status >= OrderStatus.Preparing && (
              <View style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: theme.colors.secondary },
                  ]}
                />
                <View style={styles.timelineContent}>
                  <Text
                    style={[styles.timelineTitle, { color: theme.colors.text }]}
                  >
                    Preparing
                  </Text>
                  <Text
                    style={[
                      styles.timelineTime,
                      { color: theme.colors.darkGray },
                    ]}
                  >
                    {formatOrderDate(
                      order?.preparingAt || order?.statusUpdatedAt
                    )}
                  </Text>
                </View>
              </View>
            )}

            {order?.status >= OrderStatus.ReadyForPickup && (
              <View style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: theme.colors.accent },
                  ]}
                />
                <View style={styles.timelineContent}>
                  <Text
                    style={[styles.timelineTitle, { color: theme.colors.text }]}
                  >
                    Ready for Pickup
                  </Text>
                  <Text
                    style={[
                      styles.timelineTime,
                      { color: theme.colors.darkGray },
                    ]}
                  >
                    {formatOrderDate(order?.readyAt || order?.statusUpdatedAt)}
                  </Text>
                </View>
              </View>
            )}

            {order?.status >= OrderStatus.OutForDelivery && (
              <View style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: theme.colors.primary },
                  ]}
                />
                <View style={styles.timelineContent}>
                  <Text
                    style={[styles.timelineTitle, { color: theme.colors.text }]}
                  >
                    Out for Delivery
                  </Text>
                  <Text
                    style={[
                      styles.timelineTime,
                      { color: theme.colors.darkGray },
                    ]}
                  >
                    {formatOrderDate(
                      order?.outForDeliveryAt || order?.statusUpdatedAt
                    )}
                  </Text>
                </View>
              </View>
            )}

            {order?.status === OrderStatus.Delivered && (
              <View style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: theme.colors.success },
                  ]}
                />
                <View style={styles.timelineContent}>
                  <Text
                    style={[styles.timelineTitle, { color: theme.colors.text }]}
                  >
                    Delivered
                  </Text>
                  <Text
                    style={[
                      styles.timelineTime,
                      { color: theme.colors.darkGray },
                    ]}
                  >
                    {formatOrderDate(
                      order?.deliveredAt || order?.statusUpdatedAt
                    )}
                  </Text>
                </View>
              </View>
            )}

            {order?.status === OrderStatus.Cancelled && (
              <View style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: theme.colors.error },
                  ]}
                />
                <View style={styles.timelineContent}>
                  <Text
                    style={[styles.timelineTitle, { color: theme.colors.text }]}
                  >
                    Cancelled
                  </Text>
                  <Text
                    style={[
                      styles.timelineTime,
                      { color: theme.colors.darkGray },
                    ]}
                  >
                    {formatOrderDate(
                      order?.cancelledAt || order?.statusUpdatedAt
                    )}
                  </Text>
                  {order?.cancelReason && (
                    <Text
                      style={[
                        styles.cancellationReason,
                        { color: theme.colors.error },
                      ]}
                    >
                      Reason: {order.cancelReason}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {order?.status === OrderStatus.Rejected && (
              <View style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: theme.colors.error },
                  ]}
                />
                <View style={styles.timelineContent}>
                  <Text
                    style={[styles.timelineTitle, { color: theme.colors.text }]}
                  >
                    Rejected
                  </Text>
                  <Text
                    style={[
                      styles.timelineTime,
                      { color: theme.colors.darkGray },
                    ]}
                  >
                    {formatOrderDate(
                      order?.rejectedAt || order?.statusUpdatedAt
                    )}
                  </Text>
                  {order?.rejectReason && (
                    <Text
                      style={[
                        styles.cancellationReason,
                        { color: theme.colors.error },
                      ]}
                    >
                      Reason: {order.rejectReason}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          {order?.status === OrderStatus.Pending && (
            <TouchableOpacity
              style={[styles.rejectButton, { borderColor: theme.colors.error }]}
              onPress={() => handleUpdateStatus(OrderStatus.Rejected)}
              disabled={processing}
            >
              <Text
                style={[styles.rejectButtonText, { color: theme.colors.error }]}
              >
                Reject Order
              </Text>
            </TouchableOpacity>
          )}

          {nextAction && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: nextAction.color },
              ]}
              onPress={() => handleUpdateStatus(nextAction.status)}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: theme.colors.white },
                  ]}
                >
                  {nextAction.title}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {order?.status === OrderStatus.ReadyForPickup && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleAssignDelivery}
              disabled={processing}
            >
              <Text
                style={[styles.actionButtonText, { color: theme.colors.white }]}
              >
                Assign Delivery Person
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
  statusSection: {
    padding: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 14,
  },
  section: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    marginLeft: 8,
    marginRight: 4,
    width: 60,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  addressText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  orderItem: {
    marginBottom: 16,
  },
  itemDetails: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 8,
    width: 25,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  itemOptions: {
    fontSize: 12,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  orderSummary: {
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
  },
  discountValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  timeline: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 8,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 12,
  },
  cancellationReason: {
    fontSize: 12,
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: 16,
    marginTop: 0,
  },
  rejectButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    marginRight: 8,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  actionButton: {
    flex: 2,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default OrderDetailsScreen;
