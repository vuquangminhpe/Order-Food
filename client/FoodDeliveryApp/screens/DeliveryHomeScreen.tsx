import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Alert,
  Switch,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "../contexts/LocationContext";
import { orderService, OrderStatus } from "../api/orderService";
import { useFocusEffect } from "@react-navigation/native";

const DeliveryHomeScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { currentLocation, startWatchingPosition, stopWatchingPosition } =
    useLocation();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  interface Order {
    _id: string;
    orderNumber: string;
    restaurantName: string;
    restaurantAddress: string;
    customerAddress: string;
    amount: number;
    distance: string;
    estimatedTime: number;
    items: number;
    status?: typeof OrderStatus;
    accepted_at?: string;
  }

  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Start location tracking when component mounts
  useEffect(() => {
    if (isOnline) {
      startWatchingPosition();
    }

    // Cleanup when component unmounts
    return () => {
      stopWatchingPosition();
    };
  }, [isOnline]);

  // Fetch orders when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [isOnline])
  );

  // Fetch orders
  const fetchOrders = async () => {
    if (!isOnline) return;

    try {
      setError(null);
      if (!refreshing) {
        setLoading(true);
      }

      // Fetch active deliveries assigned to this delivery person
      const activeDeliveries = await orderService.getActiveDeliveryOrders();
      setActiveOrders(activeDeliveries || []);

      // In a real app, you would fetch available orders from your backend
      // Here we'll use mock data for demonstration

      // Mock available orders
      const mockAvailableOrders = Array(5).map((_, i) => ({
        _id: `order-${i + 100}`,
        orderNumber: `ORD-${Math.floor(Math.random() * 10000)}`,
        restaurantName: [
          "Burger King",
          "Pizza Hut",
          "Subway",
          "KFC",
          "Taco Bell",
        ][i % 5],
        restaurantAddress: "123 Main St, Anytown, USA",
        customerAddress: `${i + 1}00 Elm St, Anytown, USA`,
        amount: Math.floor(Math.random() * 200) + 50,
        distance: (Math.random() * 5 + 0.5).toFixed(1),
        estimatedTime: Math.floor(Math.random() * 20) + 10,
        items: Math.floor(Math.random() * 5) + 1,
      }));

      setAvailableOrders(mockAvailableOrders as any);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle accept order
  const handleAcceptOrder = (order: any) => {
    Alert.alert(
      "Accept Order",
      `Are you sure you want to accept order #${order.orderNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          style: "default",
          onPress: async () => {
            try {
              setLoading(true);

              // In a real app, you would call an API to accept the order
              // await orderService.acceptDelivery(order._id);

              // For demo, we'll simulate a successful acceptance
              await new Promise((resolve) => setTimeout(resolve, 1000));

              // Move from available to active orders
              setAvailableOrders((prev) =>
                prev.filter((o: any) => o._id !== order._id)
              );
              setActiveOrders((prev: any) => [
                ...prev,
                {
                  ...order,
                  restaurantName: order.restaurantName,
                  restaurantAddress: order.restaurantAddress,
                  customerAddress: order.customerAddress,
                  amount: order.amount,
                  distance: order.distance,
                  estimatedTime: order.estimatedTime,
                  items: order.items,
                  status: OrderStatus.OutForDelivery,
                  accepted_at: new Date().toISOString(),
                },
              ]);

              Alert.alert("Success", "Order accepted successfully");
            } catch (error) {
              console.error("Accept order error:", error);
              Alert.alert("Error", "Failed to accept order");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle view order details
  const handleViewOrder = (order: { _id: any }) => {
    navigation.navigate("DeliveryOrderDetails", { orderId: order._id, order });
  };

  // Handle go online/offline
  const toggleOnlineStatus = () => {
    if (isOnline) {
      // Going offline
      Alert.alert(
        "Go Offline",
        "Are you sure you want to go offline? You will not receive new delivery requests.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go Offline",
            style: "destructive",
            onPress: () => {
              setIsOnline(false);
              stopWatchingPosition();
            },
          },
        ]
      );
    } else {
      // Going online
      setIsOnline(true);
      startWatchingPosition();
      fetchOrders();
    }
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // Render active order item
  const renderActiveOrderItem = ({ item }: any) => (
    <TouchableOpacity
      style={[styles.orderCard, { backgroundColor: theme.colors.card }]}
      onPress={() => handleViewOrder(item)}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={[styles.orderNumber, { color: theme.colors.text }]}>
            {item.orderNumber}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: theme.colors.primary + "20" },
            ]}
          >
            <Text style={[styles.statusText, { color: theme.colors.primary }]}>
              Active
            </Text>
          </View>
        </View>
        <Text style={[styles.orderAmount, { color: theme.colors.text }]}>
          ${item.amount?.toFixed(2) || "0.00"}
        </Text>
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationItem}>
          <MaterialCommunityIcons
            name="store"
            size={16}
            color={theme.colors.secondary}
          />
          <Text
            style={[styles.locationText, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {item.restaurantName || "Restaurant"}:{" "}
            {item.restaurantAddress || "Address"}
          </Text>
        </View>

        <View style={styles.locationDivider}>
          <MaterialCommunityIcons
            name="dots-vertical"
            size={16}
            color={theme.colors.border}
          />
        </View>

        <View style={styles.locationItem}>
          <MaterialCommunityIcons
            name="map-marker"
            size={16}
            color={theme.colors.primary}
          />
          <Text
            style={[styles.locationText, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            Customer: {item.customerAddress || "Address"}
          </Text>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <TouchableOpacity
          style={[styles.detailsButton, { borderColor: theme.colors.primary }]}
          onPress={() => handleViewOrder(item)}
        >
          <Text
            style={[styles.detailsButtonText, { color: theme.colors.primary }]}
          >
            View Details
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navigationButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => navigation.navigate("Map", { order: item })}
        >
          <MaterialCommunityIcons
            name="navigation"
            size={16}
            color={theme.colors.white}
          />
          <Text
            style={[styles.navigationButtonText, { color: theme.colors.white }]}
          >
            Navigate
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Render available order item
  const renderAvailableOrderItem = ({ item }: any) => (
    <View style={[styles.orderCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={[styles.orderNumber, { color: theme.colors.text }]}>
            {item.orderNumber}
          </Text>
          <View style={styles.orderDetails}>
            <Text style={[styles.orderItems, { color: theme.colors.darkGray }]}>
              {item.items} {item.items === 1 ? "item" : "items"}
            </Text>
            <View style={styles.dot} />
            <Text
              style={[styles.orderDistance, { color: theme.colors.darkGray }]}
            >
              {item.distance} km
            </Text>
          </View>
        </View>
        <Text style={[styles.orderAmount, { color: theme.colors.text }]}>
          ${item.amount.toFixed(2)}
        </Text>
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationItem}>
          <MaterialCommunityIcons
            name="store"
            size={16}
            color={theme.colors.secondary}
          />
          <Text
            style={[styles.locationText, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {item.restaurantName}: {item.restaurantAddress}
          </Text>
        </View>

        <View style={styles.locationDivider}>
          <MaterialCommunityIcons
            name="dots-vertical"
            size={16}
            color={theme.colors.border}
          />
        </View>

        <View style={styles.locationItem}>
          <MaterialCommunityIcons
            name="map-marker"
            size={16}
            color={theme.colors.primary}
          />
          <Text
            style={[styles.locationText, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {item.customerAddress}
          </Text>
        </View>
      </View>

      <View style={styles.estimateRow}>
        <MaterialCommunityIcons
          name="clock-outline"
          size={16}
          color={theme.colors.darkGray}
        />
        <Text style={[styles.estimateText, { color: theme.colors.darkGray }]}>
          Estimated delivery time: {item.estimatedTime} min
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.acceptButton, { backgroundColor: theme.colors.success }]}
        onPress={() => handleAcceptOrder(item)}
      >
        <Text style={[styles.acceptButtonText, { color: theme.colors.white }]}>
          Accept Order
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render empty state
  const renderEmptyState = (isActive: boolean) => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name={isActive ? "moped" : "clipboard-text"}
        size={60}
        color={theme.colors.placeholder}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        {isActive ? "No active deliveries" : "No available orders"}
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.darkGray }]}>
        {isActive
          ? "You don't have any active deliveries at the moment. Accept new orders to start delivering."
          : "There are no available orders in your area right now. Please check back later."}
      </Text>
    </View>
  );

  // Render loading state
  if (loading && !refreshing) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading orders...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.colors.text }]}>
              {`Hello, ${user?.name?.split(" ")[0] || "Driver"}`}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.darkGray }]}>
              {isOnline
                ? "You are online and available for deliveries"
                : "You are currently offline"}
            </Text>
          </View>

          <View style={styles.statusContainer}>
            <Text
              style={[
                styles.statusText,
                { color: isOnline ? theme.colors.success : theme.colors.error },
              ]}
            >
              {isOnline ? "Online" : "Offline"}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={toggleOnlineStatus}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.success + "50",
              }}
              thumbColor={isOnline ? theme.colors.success : theme.colors.error}
            />
          </View>
        </View>

        {/* Active Deliveries Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Active Deliveries
          </Text>

          {activeOrders.length > 0 ? (
            <FlatList
              data={activeOrders}
              renderItem={renderActiveOrderItem}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activeOrdersList}
            />
          ) : (
            renderEmptyState(true)
          )}
        </View>

        {/* Available Orders Section */}
        {isOnline && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Available Orders
              </Text>
              <TouchableOpacity onPress={fetchOrders}>
                <MaterialCommunityIcons
                  name="refresh"
                  size={20}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            </View>

            <FlatList
              data={availableOrders}
              renderItem={renderAvailableOrderItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.availableOrdersList}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[theme.colors.primary]}
                  tintColor={theme.colors.primary}
                />
              }
              ListEmptyComponent={() => renderEmptyState(false)}
            />
          </>
        )}

        {/* Error message if any */}
        {error && (
          <View
            style={[
              styles.errorContainer,
              { backgroundColor: "rgba(255, 0, 0, 0.1)" },
            ]}
          >
            <MaterialCommunityIcons
              name="alert-circle"
              size={20}
              color={theme.colors.error}
            />
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[
                styles.retryButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={fetchOrders}
            >
              <Text
                style={[styles.retryButtonText, { color: theme.colors.white }]}
              >
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  greeting: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 8,
  },
  sectionContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  activeOrdersList: {
    paddingVertical: 8,
  },
  availableOrdersList: {
    padding: 16,
    paddingTop: 0,
  },
  orderCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginRight: 16,
    width: 300,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  orderDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderItems: {
    fontSize: 12,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.3)",
    marginHorizontal: 6,
  },
  orderDistance: {
    fontSize: 12,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  locationContainer: {
    marginBottom: 12,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  locationText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  locationDivider: {
    alignItems: "center",
    paddingVertical: 2,
  },
  estimateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  estimateText: {
    fontSize: 12,
    marginLeft: 8,
  },
  acceptButton: {
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailsButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    marginRight: 8,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  navigationButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  navigationButtonText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 12,
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  errorContainer: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
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
  retryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default DeliveryHomeScreen;
