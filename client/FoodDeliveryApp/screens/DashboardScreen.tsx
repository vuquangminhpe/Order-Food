import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { restaurantService } from "../api/restaurantService";
import { orderService, OrderStatus } from "../api/orderService";

const DashboardScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [dashboardData, setDashboardData] = useState({
    pendingOrders: 0,
    todayOrders: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    newCustomers: 0,
    topItems: [],
    recentOrders: [],
    restaurantRating: 0,
  });

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setError("");
      if (refreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // In a real app, you would fetch this data from backend APIs
      // For now, we'll simulate the API calls with mock data

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data for restaurant dashboard
      const mockData = {
        pendingOrders: Math.floor(Math.random() * 10),
        todayOrders: Math.floor(Math.random() * 30) + 10,
        todayRevenue: Math.floor(Math.random() * 5000) + 1000,
        monthlyRevenue: Math.floor(Math.random() * 50000) + 10000,
        newCustomers: Math.floor(Math.random() * 20) + 5,
        restaurantRating: parseFloat((Math.random() * 2 + 3).toFixed(1)),

        // Top selling items
        topItems: [
          {
            name: "Burger Deluxe",
            quantity: Math.floor(Math.random() * 50) + 30,
          },
          {
            name: "French Fries",
            quantity: Math.floor(Math.random() * 40) + 20,
          },
          {
            name: "Chicken Wings",
            quantity: Math.floor(Math.random() * 30) + 15,
          },
          { name: "Coca Cola", quantity: Math.floor(Math.random() * 50) + 25 },
          {
            name: "Veggie Salad",
            quantity: Math.floor(Math.random() * 20) + 10,
          },
        ],

        // Recent orders
        recentOrders: Array(5).map((_, i) => ({
          id: `order-${i + 1}`,
          orderNumber: `ORD-${Math.floor(Math.random() * 10000)}`,
          customerName: [
            "John D.",
            "Sarah M.",
            "Michael T.",
            "Emma W.",
            "David L.",
          ][i % 5],
          amount: Math.floor(Math.random() * 200) + 50,
          status: [
            OrderStatus.Pending,
            OrderStatus.Confirmed,
            OrderStatus.Preparing,
            OrderStatus.ReadyForPickup,
          ][Math.floor(Math.random() * 4)],
          items: Math.floor(Math.random() * 5) + 1,
          time: `${Math.floor(Math.random() * 60)} min ago`,
        })),
      };

      setDashboardData(mockData as any);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Helper to get status name and color
  const getOrderStatusInfo = (status: any) => {
    switch (status) {
      case OrderStatus.Pending:
        return { name: "Pending", color: theme.colors.warning };
      case OrderStatus.Confirmed:
        return { name: "Confirmed", color: theme.colors.info };
      case OrderStatus.Preparing:
        return { name: "Preparing", color: theme.colors.info };
      case OrderStatus.ReadyForPickup:
        return { name: "Ready", color: theme.colors.success };
      case OrderStatus.OutForDelivery:
        return { name: "Delivering", color: theme.colors.primary };
      case OrderStatus.Delivered:
        return { name: "Delivered", color: theme.colors.success };
      case OrderStatus.Cancelled:
        return { name: "Cancelled", color: theme.colors.error };
      case OrderStatus.Rejected:
        return { name: "Rejected", color: theme.colors.error };
      default:
        return { name: "Unknown", color: theme.colors.darkGray };
    }
  };

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
          Loading dashboard...
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
              {`Hello, ${user?.name?.split(" ")[0] || "Restaurant Owner"}`}
            </Text>
            <Text
              style={[styles.restaurantName, { color: theme.colors.primary }]}
            >
              {(user as any)?.restaurantName || "Your Restaurant"}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.notificationButton,
              { backgroundColor: theme.colors.gray },
            ]}
            onPress={() => navigation.navigate("Notifications")}
          >
            <MaterialCommunityIcons
              name="bell"
              size={22}
              color={theme.colors.text}
            />
            <View
              style={[styles.badge, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={[styles.badgeText, { color: theme.colors.white }]}>
                3
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* Order Stats Cards */}
          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={[styles.statsCard, { backgroundColor: theme.colors.card }]}
              onPress={() => navigation.navigate("Orders")}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: "rgba(255, 90, 95, 0.1)" },
                ]}
              >
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={22}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={[styles.statsValue, { color: theme.colors.text }]}>
                {dashboardData.pendingOrders}
              </Text>
              <Text
                style={[styles.statsLabel, { color: theme.colors.darkGray }]}
              >
                Pending Orders
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statsCard, { backgroundColor: theme.colors.card }]}
              onPress={() => navigation.navigate("Orders")}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: "rgba(0, 166, 153, 0.1)" },
                ]}
              >
                <MaterialCommunityIcons
                  name="receipt"
                  size={22}
                  color={theme.colors.secondary}
                />
              </View>
              <Text style={[styles.statsValue, { color: theme.colors.text }]}>
                {dashboardData.todayOrders}
              </Text>
              <Text
                style={[styles.statsLabel, { color: theme.colors.darkGray }]}
              >
                Today's Orders
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statsCard, { backgroundColor: theme.colors.card }]}
              onPress={() => navigation.navigate("Analytics")}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: "rgba(255, 149, 0, 0.1)" },
                ]}
              >
                <MaterialCommunityIcons
                  name="cash"
                  size={22}
                  color={theme.colors.accent}
                />
              </View>
              <Text style={[styles.statsValue, { color: theme.colors.text }]}>
                ${dashboardData.todayRevenue.toLocaleString()}
              </Text>
              <Text
                style={[styles.statsLabel, { color: theme.colors.darkGray }]}
              >
                Today's Revenue
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statsCard, { backgroundColor: theme.colors.card }]}
              onPress={() => navigation.navigate("Analytics")}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: "rgba(66, 153, 225, 0.1)" },
                ]}
              >
                <MaterialCommunityIcons
                  name="star"
                  size={22}
                  color={theme.colors.info}
                />
              </View>
              <Text style={[styles.statsValue, { color: theme.colors.text }]}>
                {dashboardData.restaurantRating}
              </Text>
              <Text
                style={[styles.statsLabel, { color: theme.colors.darkGray }]}
              >
                Rating
              </Text>
            </TouchableOpacity>
          </View>

          {/* Revenue Card */}
          <View
            style={[styles.revenueCard, { backgroundColor: theme.colors.card }]}
          >
            <View style={styles.revenueHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Monthly Revenue
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Analytics")}
              >
                <Text
                  style={[styles.seeAllText, { color: theme.colors.primary }]}
                >
                  See Details
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.revenueAmount, { color: theme.colors.text }]}>
              ${dashboardData.monthlyRevenue.toLocaleString()}
            </Text>

            <View style={styles.revenueCompare}>
              <View
                style={[
                  styles.revenueIndicator,
                  {
                    backgroundColor:
                      dashboardData.monthlyRevenue > 20000
                        ? theme.colors.success
                        : theme.colors.error,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    dashboardData.monthlyRevenue > 20000
                      ? "arrow-up"
                      : "arrow-down"
                  }
                  size={14}
                  color="#FFF"
                />
              </View>
              <Text
                style={[
                  styles.revenueCompareText,
                  {
                    color:
                      dashboardData.monthlyRevenue > 20000
                        ? theme.colors.success
                        : theme.colors.error,
                  },
                ]}
              >
                {dashboardData.monthlyRevenue > 20000 ? "+12.5%" : "-5.8%"} from
                last month
              </Text>
            </View>
          </View>

          {/* Recent Orders */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Recent Orders
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Orders")}>
                <Text
                  style={[styles.seeAllText, { color: theme.colors.primary }]}
                >
                  See All
                </Text>
              </TouchableOpacity>
            </View>

            {dashboardData.recentOrders.map((order: any, index: any) => (
              <TouchableOpacity
                key={order.id}
                style={[
                  styles.orderItem,
                  {
                    backgroundColor: theme.colors.card,
                    borderBottomColor:
                      index < dashboardData.recentOrders.length - 1
                        ? theme.colors.border
                        : "transparent",
                  },
                ]}
                onPress={() =>
                  navigation.navigate("OrderDetails", { orderId: order.id })
                }
              >
                <View style={styles.orderTopRow}>
                  <Text
                    style={[styles.orderNumber, { color: theme.colors.text }]}
                  >
                    {order.orderNumber}
                  </Text>
                  <View
                    style={[
                      styles.orderStatusBadge,
                      {
                        backgroundColor:
                          getOrderStatusInfo(order.status).color + "20",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.orderStatusText,
                        { color: getOrderStatusInfo(order.status).color },
                      ]}
                    >
                      {getOrderStatusInfo(order.status).name}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderBottomRow}>
                  <View style={styles.orderCustomerInfo}>
                    <Text
                      style={[
                        styles.orderCustomerName,
                        { color: theme.colors.text },
                      ]}
                    >
                      {order.customerName}
                    </Text>
                    <Text
                      style={[
                        styles.orderInfo,
                        { color: theme.colors.darkGray },
                      ]}
                    >
                      {order.items} {order.items === 1 ? "item" : "items"} •{" "}
                      {order.time}
                    </Text>
                  </View>
                  <Text
                    style={[styles.orderAmount, { color: theme.colors.text }]}
                  >
                    ${order.amount}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Top Items */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Top Selling Items
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Menu")}>
                <Text
                  style={[styles.seeAllText, { color: theme.colors.primary }]}
                >
                  Manage Menu
                </Text>
              </TouchableOpacity>
            </View>

            {dashboardData.topItems.map((item: any, index) => (
              <View
                key={index}
                style={[
                  styles.topItemRow,
                  {
                    backgroundColor: theme.colors.card,
                    borderBottomColor:
                      index < dashboardData.topItems.length - 1
                        ? theme.colors.border
                        : "transparent",
                  },
                ]}
              >
                <View style={styles.itemRank}>
                  <Text
                    style={[styles.rankNumber, { color: theme.colors.primary }]}
                  >
                    #{index + 1}
                  </Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: theme.colors.text }]}>
                    {item.name}
                  </Text>
                </View>
                <Text
                  style={[styles.itemQuantity, { color: theme.colors.text }]}
                >
                  {item.quantity} sold
                </Text>
              </View>
            ))}
          </View>

          {/* Bottom padding */}
          <View style={{ height: 20 }} />
        </ScrollView>

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
              onPress={fetchDashboardData}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 14,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statsCard: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
  },
  revenueCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  revenueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  revenueAmount: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  revenueCompare: {
    flexDirection: "row",
    alignItems: "center",
  },
  revenueIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  revenueCompareText: {
    fontSize: 14,
    fontWeight: "500",
  },
  sectionContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  orderItem: {
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  orderTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: "500",
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  orderBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderCustomerInfo: {
    flex: 1,
  },
  orderCustomerName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  orderInfo: {
    fontSize: 12,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  topItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderBottomWidth: 1,
  },
  itemRank: {
    width: 30,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: "bold",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: "500",
  },
  errorContainer: {
    margin: 16,
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

export default DashboardScreen;
