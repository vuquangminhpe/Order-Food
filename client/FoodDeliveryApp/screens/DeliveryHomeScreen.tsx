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
import userService from "@/api/userService";
import apiService from "@/api/apiService";

const DeliveryHomeScreen = ({ navigation }: any) => {
  // ============= MOCK DATA GENERATION FUNCTIONS =============
  // These functions will generate mock data when API calls fail

  // Central location for mock data (e.g., Ho Chi Minh City)
  const centralLocation = {
    lat: 10.7758439,
    lng: 106.7017555,
  };

  // Helper to generate a location near the central point
  const getNearbyLocation = (maxDistanceKm = 5) => {
    // 0.01 in lat/lng is roughly 1km
    const latOffset =
      (Math.random() * maxDistanceKm * 2 - maxDistanceKm) * 0.01;
    const lngOffset =
      (Math.random() * maxDistanceKm * 2 - maxDistanceKm) * 0.01;

    return {
      lat: centralLocation.lat + latOffset,
      lng: centralLocation.lng + lngOffset,
    };
  };

  // Mock restaurants
  const mockRestaurants = [
    {
      _id: "rest001",
      name: "Phở Hà Nội",
      address: "123 Nguyễn Huệ, District 1",
      location: getNearbyLocation(3),
    },
    {
      _id: "rest002",
      name: "Bánh Mì Express",
      address: "45 Lê Lợi, District 1",
      location: getNearbyLocation(2),
    },
    {
      _id: "rest003",
      name: "Cơm Tấm Sài Gòn",
      address: "78 Võ Văn Tần, District 3",
      location: getNearbyLocation(4),
    },
    {
      _id: "rest004",
      name: "Bún Chả 36",
      address: "112 Hai Bà Trưng, District 1",
      location: getNearbyLocation(3.5),
    },
    {
      _id: "rest005",
      name: "Highlands Coffee",
      address: "333 Nguyễn Trãi, District 5",
      location: getNearbyLocation(5),
    },
  ];

  // Mock food items
  const mockFoodItems = [
    { name: "Phở Bò", price: 55000 },
    { name: "Bánh Mì Thịt", price: 25000 },
    { name: "Cơm Tấm Sườn", price: 45000 },
    { name: "Bún Chả", price: 60000 },
    { name: "Cà Phê Sữa Đá", price: 35000 },
    { name: "Trà Sữa Trân Châu", price: 40000 },
    { name: "Gỏi Cuốn", price: 35000 },
    { name: "Chả Giò", price: 30000 },
    { name: "Bún Bò Huế", price: 65000 },
    { name: "Bún Thịt Nướng", price: 50000 },
  ];

  // Mock customer addresses
  const mockAddresses = [
    { address: "12 Lý Tự Trọng, District 1", location: getNearbyLocation() },
    { address: "56 Trần Hưng Đạo, District 1", location: getNearbyLocation() },
    { address: "789 Điện Biên Phủ, District 3", location: getNearbyLocation() },
    { address: "45 Võ Thị Sáu, District 3", location: getNearbyLocation() },
    { address: "67 Lê Thánh Tôn, District 1", location: getNearbyLocation() },
    {
      address: "890 Nam Kỳ Khởi Nghĩa, District 3",
      location: getNearbyLocation(),
    },
  ];

  // Generate a random order number
  const generateOrderNumber = () => {
    return `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  // Generate random items for an order
  const generateOrderItems = (maxItems = 5) => {
    const numItems = Math.floor(Math.random() * maxItems) + 1;
    const items = [];

    for (let i = 0; i < numItems; i++) {
      const randomItem =
        mockFoodItems[Math.floor(Math.random() * mockFoodItems.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;

      items.push({
        ...randomItem,
        quantity,
        totalPrice: randomItem.price * quantity,
      });
    }

    return items;
  };

  // Calculate total from items
  const calculateTotal = (items: any[]) => {
    return items.reduce(
      (total: any, item: { totalPrice: any }) => total + (item.totalPrice || 0),
      0
    );
  };

  // Generate a single mock order
  const generateMockOrder = (
    status = OrderStatus.ReadyForPickup,
    hasDeliveryPerson = false
  ) => {
    const restaurant =
      mockRestaurants[Math.floor(Math.random() * mockRestaurants.length)];
    const deliveryAddress =
      mockAddresses[Math.floor(Math.random() * mockAddresses.length)];
    const items = generateOrderItems();
    const total = calculateTotal(items);

    return {
      _id: `order_${Math.random().toString(36).substr(2, 9)}`,
      orderNumber: generateOrderNumber(),
      status: status,
      items: items,
      total: total,
      subtotal: total * 0.9,
      deliveryFee: 15000,
      restaurant: restaurant,
      deliveryAddress: deliveryAddress,
      estimatedDeliveryTime: Math.floor(Math.random() * 30) + 15, // 15-45 minutes
      createdAt: new Date(
        Date.now() - Math.floor(Math.random() * 3600000)
      ).toISOString(), // Within the last hour
      deliveryPersonId: hasDeliveryPerson ? user?.id : undefined,
      paymentMethod: Math.random() > 0.5 ? 0 : 1, // Cash or Card
      notes:
        Math.random() > 0.7 ? "Please bring extra napkins and chopsticks" : "",
    };
  };

  // Generate multiple mock orders
  const generateMockOrders = (
    count = 10,
    status = OrderStatus.ReadyForPickup,
    hasDeliveryPerson = false
  ) => {
    const orders = [];
    for (let i = 0; i < count; i++) {
      orders.push(generateMockOrder(status, hasDeliveryPerson));
    }
    return orders;
  };

  // Generate mock active orders (already assigned to the current delivery person)
  const generateMockActiveOrders = (count = 2) => {
    return generateMockOrders(count, OrderStatus.OutForDelivery, true);
  };

  // Generate mock available orders (ready for pickup, not assigned)
  const generateMockAvailableOrders = (count = 5) => {
    return generateMockOrders(count, OrderStatus.ReadyForPickup, false);
  };

  // ============= COMPONENT STATE AND HOOKS =============
  const { theme } = useTheme();
  const { user } = useAuth();
  const { currentLocation, startWatchingPosition, stopWatchingPosition } =
    useLocation();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  // Start location tracking when component mounts
  useEffect(() => {
    if (isOnline) {
      startWatchingPosition();
      // Update delivery person status on server
      updateDeliveryStatus(true);
    }

    // Cleanup when component unmounts
    return () => {
      stopWatchingPosition();
    };
  }, [isOnline]);

  // Update delivery person status on server
  const updateDeliveryStatus = async (isAvailable: boolean) => {
    try {
      await userService.updateDeliveryStatus(isAvailable);
    } catch (err) {
      console.error("Error updating delivery status:", err);
    }
  };

  // Update location on server
  const updateLocationOnServer = async () => {
    if (!currentLocation || !isOnline) return;

    try {
      await userService.updateLocation(
        currentLocation.lat,
        currentLocation.lng
      );
    } catch (err) {
      console.error("Error updating location:", err);
    }
  };

  // Update location periodically
  useEffect(() => {
    if (!isOnline || !currentLocation) return;

    updateLocationOnServer();

    const interval = setInterval(() => {
      updateLocationOnServer();
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [currentLocation, isOnline]);

  // Fetch orders when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (isOnline) {
        fetchOrders();
      }
    }, [isOnline])
  );

  // UPDATED: Fetch orders with fallback to mock data
  const fetchOrders = async () => {
    if (!isOnline) return;

    try {
      setError(null);
      if (!refreshing) {
        setLoading(true);
      }

      // Try to fetch active deliveries from API
      let activeDeliveriesResponse = [];
      let useActiveMockData = false;

      try {
        activeDeliveriesResponse = await orderService.getActiveDeliveryOrders();
        if (
          !activeDeliveriesResponse ||
          activeDeliveriesResponse.length === 0
        ) {
          useActiveMockData = true;
        }
      } catch (err) {
        console.error("Error fetching active deliveries:", err);
        useActiveMockData = true;
      }

      // Set active orders (API data or mock data)
      if (useActiveMockData) {
        activeDeliveriesResponse = generateMockActiveOrders(2);
        setUsingMockData(true);
        console.log("Using mock active orders data");
      }

      setActiveOrders(activeDeliveriesResponse || []);

      // Try to fetch available orders from API
      let availableOrdersFiltered = [];
      let useAvailableMockData = false;

      try {
        // Make a direct API call to get all recent orders
        const response = await apiService.get(`/orders/user?limit=20`);

        if (
          response &&
          response.result &&
          Array.isArray(response.result.orders)
        ) {
          // Filter orders client-side instead of server-side
          availableOrdersFiltered = response.result.orders.filter(
            (order: any) => {
              return (
                // Check if status matches ReadyForPickup (3)
                order.status === 3 &&
                // Check that no delivery person is assigned
                !order.deliveryPersonId
              );
            }
          );

          if (availableOrdersFiltered.length === 0) {
            useAvailableMockData = true;
          }
        } else {
          useAvailableMockData = true;
        }
      } catch (err) {
        console.error("Error in direct API call:", err);
        useAvailableMockData = true;
      }

      // Set available orders (API data or mock data)
      if (useAvailableMockData) {
        availableOrdersFiltered = generateMockAvailableOrders(4);
        setUsingMockData(true);
        console.log("Using mock available orders data");
      }

      console.log("Available orders count:", availableOrdersFiltered.length);
      setAvailableOrders(availableOrdersFiltered || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders. Please try again.");

      // Fallback to mock data even if the entire function fails
      setActiveOrders(generateMockActiveOrders(2));
      setAvailableOrders(generateMockAvailableOrders(4));
      setUsingMockData(true);
      console.log("Using mock data due to error");
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

              if (usingMockData) {
                // For mock data, just simulate acceptance
                setTimeout(() => {
                  // Move the order from available to active
                  const updatedOrder = {
                    ...order,
                    status: OrderStatus.OutForDelivery,
                    deliveryPersonId: user?.id,
                  };
                  setActiveOrders([...activeOrders, updatedOrder]);
                  setAvailableOrders(
                    availableOrders.filter((o) => o._id !== order._id)
                  );
                  Alert.alert("Success", "Order accepted successfully");
                  setLoading(false);
                }, 1000);
                return;
              }

              // Call API to accept the order
              await orderService.assignDeliveryPerson(
                order._id,
                user?.id as string
              );

              // Update order status to out for delivery
              await orderService.updateOrderStatus(
                order._id,
                OrderStatus.OutForDelivery
              );

              // Refresh orders
              await fetchOrders();

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
              updateDeliveryStatus(false);
            },
          },
        ]
      );
    } else {
      // Going online
      setIsOnline(true);
      startWatchingPosition();
      updateDeliveryStatus(true);
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
          ${item.total?.toFixed(2) || "0.00"}
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
            {item.restaurant?.name || "Restaurant"}:{" "}
            {item.restaurant?.address || "Address"}
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
            Customer: {item.deliveryAddress?.address || "Address"}
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
              {item.items?.length || 0}{" "}
              {item.items?.length === 1 ? "item" : "items"}
            </Text>
            <View style={styles.dot} />
            <Text
              style={[styles.orderDistance, { color: theme.colors.darkGray }]}
            >
              {calculateDistance(
                currentLocation?.lat,
                currentLocation?.lng,
                item.restaurant?.location?.lat,
                item.restaurant?.location?.lng
              ).toFixed(1)}{" "}
              km
            </Text>
          </View>
        </View>
        <Text style={[styles.orderAmount, { color: theme.colors.text }]}>
          ${item.total?.toFixed(2) || "0.00"}
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
            {item.restaurant?.name || "Restaurant"}:{" "}
            {item.restaurant?.address || "Address"}
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
            {item.deliveryAddress?.address || "Address"}
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
          Estimated delivery time: {item.estimatedDeliveryTime || 30} min
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

  // Calculate distance between two points
  const calculateDistance = (
    lat1?: number,
    lng1?: number,
    lat2?: number,
    lng2?: number
  ) => {
    if (!lat1 || !lng1 || !lat2 || !lng2) return 0;

    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  };

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

        {/* Mock Data Indicator */}
        {usingMockData && (
          <View
            style={{
              position: "absolute",
              top: 60,
              right: 16,
              backgroundColor: "rgba(255, 193, 7, 0.9)",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              zIndex: 999,
            }}
          >
            <Text style={{ color: "#000", fontWeight: "bold", fontSize: 12 }}>
              Using Demo Data
            </Text>
          </View>
        )}

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
