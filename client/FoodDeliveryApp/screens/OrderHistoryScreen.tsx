import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../contexts/ThemeContext";
import { orderService, OrderStatus } from "../api/orderService";
import OrderHistoryItem from "../components/order/OrderHistoryItem";
import FilterChip from "../components/general/FilterChip";
import EmptyState from "../components/cart/EmptyState";

// Tab categories for filtering orders
const TABS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const OrderHistoryScreen = ({ navigation }: any) => {
  const { theme } = useTheme();

  // State
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch orders
  const fetchOrders = async (page = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      // Determine which orders to fetch based on active tab
      let status;
      switch (activeTab) {
        case "active":
          status = [
            OrderStatus.Pending,
            OrderStatus.Confirmed,
            OrderStatus.Preparing,
            OrderStatus.ReadyForPickup,
            OrderStatus.OutForDelivery,
          ].join(",");
          break;
        case "completed":
          status = OrderStatus.Delivered;
          break;
        case "cancelled":
          status = [OrderStatus.Cancelled, OrderStatus.Rejected].join(",");
          break;
        default:
          status = undefined;
      }

      const response = await orderService.getUserOrders({
        page,
        limit: pagination.limit,
        status: status as any,
        sortBy: "created_at",
        sortOrder: "desc",
      });

      // If refreshing or first page, replace orders
      // Otherwise, append to existing orders
      if (refresh || page === 1) {
        setOrders(response.orders);
      } else {
        setOrders((prev) => [...prev, ...response.orders]);
      }

      setPagination({
        ...response.pagination,
        page,
      });
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load order history. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOrders(1);
  }, [activeTab]);

  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchOrders(1, true);
    }, [activeTab])
  );

  // Pull to refresh
  const onRefresh = useCallback(() => {
    fetchOrders(1, true);
  }, [activeTab]);

  // Load more when reaching the end of the list
  const handleLoadMore = () => {
    if (!loadingMore && !refreshing && pagination.page < pagination.pages) {
      fetchOrders(pagination.page + 1);
    }
  };

  // Change active tab
  const handleTabChange = (tabId: React.SetStateAction<string>) => {
    setActiveTab(tabId);
    // Fetch will be triggered by useEffect
  };

  // Navigate to order details
  const handleOrderPress = (order: { _id: any }) => {
    navigation.navigate("OrderDetails", { orderId: order._id });
  };

  // Render order item
  const renderOrderItem = ({ item }: any) => (
    <OrderHistoryItem order={item} onPress={() => handleOrderPress(item)} />
  );

  // Render empty state
  const renderEmptyState = () => {
    if (loading) return null;

    let message = "You haven't placed any orders yet";
    let description = "Your order history will appear here";

    switch (activeTab) {
      case "active":
        message = "No active orders";
        description = "Orders that are being processed will appear here";
        break;
      case "completed":
        message = "No completed orders";
        description = "Orders that have been delivered will appear here";
        break;
      case "cancelled":
        message = "No cancelled orders";
        description = "Cancelled or rejected orders will appear here";
        break;
    }

    return (
      <EmptyState
        icon="receipt"
        title={message}
        description={description}
        buttonText="Browse Restaurants"
        onButtonPress={() => navigation.navigate("Home")}
      />
    );
  };

  // Render footer (loading indicator when loading more)
  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={[styles.footerText, { color: theme.colors.darkGray }]}>
          Loading more orders...
        </Text>
      </View>
    );
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
          Loading order history...
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
        {/* Filter Tabs */}
        <View
          style={[
            styles.filterContainer,
            { borderBottomColor: theme.colors.border },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {TABS.map((tab) => (
              <FilterChip
                key={tab.id}
                label={tab.label}
                active={activeTab === tab.id}
                onPress={() => handleTabChange(tab.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Order List */}
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id.toString()}
          renderItem={renderOrderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          contentContainerStyle={
            orders.length === 0 ? styles.emptyListContent : null
          }
        />

        {/* Error message if any */}
        {error && (
          <View
            style={[
              styles.errorContainer,
              { backgroundColor: "rgba(255, 0, 0, 0.1)" },
            ]}
          >
            <Icon name="alert-circle" size={20} color={theme.colors.error} />
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[
                styles.retryButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => fetchOrders(1, true)}
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
  filterContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  footerContainer: {
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default OrderHistoryScreen;
