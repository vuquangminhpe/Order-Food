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
  Linking,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../contexts/ThemeContext";
import { orderService, OrderStatus } from "../api/orderService";
import { useLocation } from "../contexts/LocationContext";

const DeliveryOrderDetailsScreen = ({ route, navigation }: any) => {
  const { orderId, order: initialOrder } = route.params;
  const { theme } = useTheme();
  const { currentLocation } = useLocation();

  // State
  const [order, setOrder] = useState(initialOrder || null);
  const [loading, setLoading] = useState(!initialOrder);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch order details if not provided
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (initialOrder) return;

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
  }, [orderId, initialOrder]);

  // Format date
  const formatDate = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  // Get status name
  const getStatusName = (status: any) => {
    switch (status) {
      case OrderStatus.Pending:
        return "Pending";
      case OrderStatus.Confirmed:
        return "Confirmed";
      case OrderStatus.Preparing:
        return "Preparing";
      case OrderStatus.ReadyForPickup:
        return "Ready for Pickup";
      case OrderStatus.OutForDelivery:
        return "Out for Delivery";
      case OrderStatus.Delivered:
        return "Delivered";
      case OrderStatus.Cancelled:
        return "Cancelled";
      case OrderStatus.Rejected:
        return "Rejected";
      default:
        return "Unknown";
    }
  };

  // Get status color
  const getStatusColor = (status: any) => {
    switch (status) {
      case OrderStatus.Pending:
        return theme.colors.warning;
      case OrderStatus.Confirmed:
        return theme.colors.info;
      case OrderStatus.Preparing:
        return theme.colors.secondary;
      case OrderStatus.ReadyForPickup:
        return theme.colors.accent;
      case OrderStatus.OutForDelivery:
        return theme.colors.primary;
      case OrderStatus.Delivered:
        return theme.colors.success;
      case OrderStatus.Cancelled:
      case OrderStatus.Rejected:
        return theme.colors.error;
      default:
        return theme.colors.darkGray;
    }
  };

  // Handle pickup from restaurant
  const handlePickupOrder = () => {
    if (!order) return;

    Alert.alert(
      "Confirm Pickup",
      "Have you picked up this order from the restaurant?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Pickup",
          onPress: async () => {
            try {
              setProcessing(true);

              // In a real app, call API to update status
              await orderService.updateOrderStatus(
                orderId,
                OrderStatus.OutForDelivery
              );

              // Update local state
              setOrder((prev: any) => ({
                ...prev,
                status: OrderStatus.OutForDelivery,
                statusUpdatedAt: new Date().toISOString(),
              }));

              Alert.alert(
                "Success",
                "Order marked as picked up and out for delivery"
              );
            } catch (error) {
              console.error("Pickup order error:", error);
              Alert.alert("Error", "Failed to update order status");
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  // Handle deliver to customer
  const handleDeliverOrder = () => {
    if (!order) return;

    Alert.alert(
      "Confirm Delivery",
      "Have you delivered this order to the customer?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Delivery",
          onPress: async () => {
            try {
              setProcessing(true);

              // In a real app, call API to update status
              await orderService.updateOrderStatus(
                orderId,
                OrderStatus.Delivered
              );

              // Update local state
              setOrder((prev: any) => ({
                ...prev,
                status: OrderStatus.Delivered,
                statusUpdatedAt: new Date().toISOString(),
              }));

              Alert.alert("Success", "Order marked as delivered");

              // Navigate back to home after short delay
              setTimeout(() => {
                navigation.navigate("Home");
              }, 1500);
            } catch (error) {
              console.error("Deliver order error:", error);
              Alert.alert("Error", "Failed to update order status");
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  // Handle call customer
  const handleCallCustomer = () => {
    if (!order?.customer?.phone) {
      Alert.alert("Error", "Customer phone number not available");
      return;
    }

    Linking.openURL(`tel:${order.customer.phone}`);
  };

  // Handle navigate to customer
  const handleNavigateToCustomer = () => {
    if (!order?.deliveryAddress?.lat || !order?.deliveryAddress?.lng) {
      Alert.alert("Error", "Customer location not available");
      return;
    }

    const scheme = Platform.select({ ios: "maps:", android: "geo:" });
    const url = Platform.select({
      ios: `${scheme}?q=${order.deliveryAddress.lat},${order.deliveryAddress.lng}`,
      android: `${scheme}${order.deliveryAddress.lat},${order.deliveryAddress.lng}`,
    });

    Linking.openURL(url as any);
  };

  // Handle navigate to restaurant
  const handleNavigateToRestaurant = () => {
    if (
      !order?.restaurant?.location?.lat ||
      !order?.restaurant?.location?.lng
    ) {
      Alert.alert("Error", "Restaurant location not available");
      return;
    }

    const scheme = Platform.select({ ios: "maps:", android: "geo:" });
    const url = Platform.select({
      ios: `${scheme}?q=${order.restaurant.location.lat},${order.restaurant.location.lng}`,
      android: `${scheme}${order.restaurant.location.lat},${order.restaurant.location.lng}`,
    });

    Linking.openURL(url as any);
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

  if (!order) return null;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Order header */}
        <View
          style={[styles.orderHeader, { backgroundColor: theme.colors.card }]}
        >
          <View style={styles.orderInfo}>
            <Text style={[styles.orderNumber, { color: theme.colors.text }]}>
              Order #{order.orderNumber}
            </Text>
            <Text style={[styles.orderDate, { color: theme.colors.darkGray }]}>
              {formatDate(order.created_at)}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(order.status) + "20" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(order.status) },
              ]}
            >
              {getStatusName(order.status)}
            </Text>
          </View>
        </View>

        {/* Restaurant and Customer info */}
        <View
          style={[
            styles.locationSection,
            { backgroundColor: theme.colors.card },
          ]}
        >
          {/* Restaurant info */}
          <TouchableOpacity
            style={styles.locationContainer}
            onPress={
              order.status === OrderStatus.ReadyForPickup
                ? handleNavigateToRestaurant
                : undefined
            }
          >
            <View
              style={[
                styles.locationIcon,
                { backgroundColor: theme.colors.secondary + "20" },
              ]}
            >
              <Icon name="store" size={20} color={theme.colors.secondary} />
            </View>

            <View style={styles.locationInfo}>
              <Text
                style={[styles.locationLabel, { color: theme.colors.darkGray }]}
              >
                Restaurant
              </Text>
              <Text style={[styles.locationName, { color: theme.colors.text }]}>
                {order.restaurant?.name || "Restaurant"}
              </Text>
              <Text
                style={[
                  styles.locationAddress,
                  { color: theme.colors.darkGray },
                ]}
              >
                {order.restaurant?.address || "Address not available"}
              </Text>
            </View>

            {order.status === OrderStatus.ReadyForPickup && (
              <View style={styles.navigationButton}>
                <Icon
                  name="navigation"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
            )}
          </TouchableOpacity>

          <View
            style={[styles.divider, { backgroundColor: theme.colors.border }]}
          />

          {/* Customer info */}
          <TouchableOpacity
            style={styles.locationContainer}
            onPress={
              order.status === OrderStatus.ReadyForPickup
                ? handleNavigateToRestaurant
                : undefined
            }

          >
            <View
              style={[
                styles.locationIcon,
                { backgroundColor: theme.colors.primary + "20" },
              ]}
            >
              <Icon name="account" size={20} color={theme.colors.primary} />
            </View>

            <View style={styles.locationInfo}>
              <Text
                style={[styles.locationLabel, { color: theme.colors.darkGray }]}
              >
                Customer
              </Text>
              <Text style={[styles.locationName, { color: theme.colors.text }]}>
                {order.customer?.name || "Customer"}
              </Text>
              <Text
                style={[
                  styles.locationAddress,
                  { color: theme.colors.darkGray },
                ]}
              >
                {order.deliveryAddress?.address || "Address not available"}
              </Text>
            </View>

            {order.status === OrderStatus.OutForDelivery && (
              <TouchableOpacity
                style={styles.callButton}
                onPress={handleCallCustomer}
              >
                <Icon name="phone" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {/* Order items */}
        <View
          style={[
            styles.orderItemsSection,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Order Items
          </Text>

          {order.items.map(
            (
              item: {
                quantity:
                  | string
                  | number
                  | boolean
                  | React.ReactElement<
                      any,
                      string | React.JSXElementConstructor<any>
                    >
                  | Iterable<React.ReactNode>
                  | React.ReactPortal
                  | null
                  | undefined;
                name:
                  | string
                  | number
                  | boolean
                  | React.ReactElement<
                      any,
                      string | React.JSXElementConstructor<any>
                    >
                  | Iterable<React.ReactNode>
                  | React.ReactPortal
                  | null
                  | undefined;
                options: any[];
                totalPrice: number;
              },
              index: React.Key | null | undefined
            ) => (
              <View
                key={index}
                style={[
                  styles.orderItem,
                  typeof index === 'number' && index < order.items.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.itemInfo}>
                  <Text
                    style={[
                      styles.itemQuantity,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {item.quantity}x
                  </Text>
                  <View style={styles.itemDetails}>
                    <Text
                      style={[styles.itemName, { color: theme.colors.text }]}
                    >
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
                            (option: { title: any; items: any[] }) =>
                              `${option.title}: ${option.items
                                .map((i: { name: any }) => i.name)
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
            )
          )}

          {/* Order Totals */}
          <View style={styles.orderTotals}>
            <View style={styles.totalRow}>
              <Text
                style={[styles.totalLabel, { color: theme.colors.darkGray }]}
              >
                Subtotal
              </Text>
              <Text style={[styles.totalValue, { color: theme.colors.text }]}>
                ${order.subtotal.toFixed(2)}
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text
                style={[styles.totalLabel, { color: theme.colors.darkGray }]}
              >
                Delivery Fee
              </Text>
              <Text style={[styles.totalValue, { color: theme.colors.text }]}>
                ${order.deliveryFee.toFixed(2)}
              </Text>
            </View>

            {order.serviceCharge > 0 && (
              <View style={styles.totalRow}>
                <Text
                  style={[styles.totalLabel, { color: theme.colors.darkGray }]}
                >
                  Service Charge
                </Text>
                <Text style={[styles.totalValue, { color: theme.colors.text }]}>
                  ${order.serviceCharge.toFixed(2)}
                </Text>
              </View>
            )}

            {order.discount > 0 && (
              <View style={styles.totalRow}>
                <Text
                  style={[styles.totalLabel, { color: theme.colors.darkGray }]}
                >
                  Discount
                </Text>
                <Text
                  style={[styles.totalValue, { color: theme.colors.success }]}
                >
                  -${order.discount.toFixed(2)}
                </Text>
              </View>
            )}

            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text
                style={[styles.grandTotalLabel, { color: theme.colors.text }]}
              >
                Total
              </Text>
              <Text
                style={[
                  styles.grandTotalValue,
                  { color: theme.colors.primary },
                ]}
              >
                ${order.total.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View
          style={[
            styles.paymentSection,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Payment Details
          </Text>

          <View style={styles.paymentRow}>
            <Icon
              name={order.paymentMethod === 0 ? "cash" : "credit-card"}
              size={20}
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
              size={20}
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
          <View
            style={[
              styles.notesSection,
              { backgroundColor: theme.colors.card },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Order Notes
            </Text>
            <Text style={[styles.notes, { color: theme.colors.text }]}>
              {order.notes}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          {order.status === OrderStatus.ReadyForPickup && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.accent },
              ]}
              onPress={handlePickupOrder}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Icon name="package-up" size={20} color="#FFF" />
                  <Text
                    style={[
                      styles.actionButtonText,
                      { color: theme.colors.white },
                    ]}
                  >
                    Confirm Pickup
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {order.status === OrderStatus.OutForDelivery && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.success },
              ]}
              onPress={handleDeliverOrder}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Icon name="check-circle" size={20} color="#FFF" />
                  <Text
                    style={[
                      styles.actionButtonText,
                      { color: theme.colors.white },
                    ]}
                  >
                    Complete Delivery
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {(order.status === OrderStatus.ReadyForPickup ||
            order.status === OrderStatus.OutForDelivery) && (
            <TouchableOpacity
              style={[
                styles.mapButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => navigation.navigate("Map")}
              disabled={processing}
            >
              <Icon name="map" size={20} color="#FFF" />
              <Text
                style={[styles.actionButtonText, { color: theme.colors.white }]}
              >
                Open Map
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom padding */}
        <View style={{ height: 30 }} />
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
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginBottom: 10,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  locationSection: {
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    overflow: "hidden",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
  },
  navigationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  orderItemsSection: {
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  itemInfo: {
    flexDirection: "row",
    flex: 1,
  },
  itemQuantity: {
    fontSize: 16,
    fontWeight: "500",
    marginRight: 8,
    width: 30,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  itemOptions: {
    fontSize: 12,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "500",
  },
  orderTotals: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  totalLabel: {
    fontSize: 14,
  },
  totalValue: {
    fontSize: 14,
  },
  grandTotalRow: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: 8,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  paymentSection: {
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    padding: 16,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  paymentMethod: {
    fontSize: 16,
    marginLeft: 8,
  },
  paymentStatus: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  notesSection: {
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    padding: 16,
  },
  notes: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  actionButton: {
    flexDirection: "row",
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  mapButton: {
    flexDirection: "row",
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default DeliveryOrderDetailsScreen;
