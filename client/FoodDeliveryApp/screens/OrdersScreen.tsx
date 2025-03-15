import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Alert,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { orderService, OrderStatus } from "../api/orderService";
import FilterChip from "../components/general/FilterChip";
import { useFocusEffect } from "@react-navigation/native";
import restaurantService from "@/api/restaurantService";

// Tab categories for filtering orders
const ORDER_TABS = [
  { id: "all", label: "All" },
  { id: "pending", label: "New" },
  { id: "preparing", label: "Preparing" },
  { id: "ready", label: "Ready" },
  { id: "delivering", label: "Delivering" },
  { id: "completed", label: "Completed" },
];

const OrdersScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  // State
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [error, setError] = useState("");
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

      setError("");

      // Get restaurant ID from user
      const restaurantId = user?.restaurantId || "1"; // Fallback to a default ID for demo

      // Determine which orders to fetch based on active tab
      let status;
      switch (activeTab) {
        case "pending":
          status = [OrderStatus.Pending].join(",");
          break;
        case "preparing":
          status = [OrderStatus.Confirmed, OrderStatus.Preparing].join(",");
          break;
        case "ready":
          status = [OrderStatus.ReadyForPickup].join(",");
          break;
        case "delivering":
          status = [OrderStatus.OutForDelivery].join(",");
          break;
        case "completed":
          status = [
            OrderStatus.Delivered,
            OrderStatus.Cancelled,
            OrderStatus.Rejected,
          ].join(",");
          break;
        default:
          status = undefined;
      }

      // Fetch restaurant orders
      const response = await restaurantService.getRestaurantOrders(
        restaurantId,
        {
          page,
          limit: pagination.limit,
          status,
        }
      );

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

      // Apply search filter
      filterOrders(response.orders, searchText);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Filter orders based on search text
  const filterOrders = (ordersList: any[], search: string) => {
    if (!search.trim()) {
      setFilteredOrders(ordersList as any);
      return;
    }

    const filtered = Array.isArray(ordersList)
      ? ordersList.filter(
          (order: {
            orderNumber: string;
            customer: { name: string; phone: string };
          }) => {
            const searchLower = search.toLowerCase();
            return (
              order.orderNumber.toLowerCase().includes(searchLower) ||
              order.customer?.name?.toLowerCase().includes(searchLower) ||
              order.customer?.phone?.toLowerCase().includes(searchLower)
            );
          }
        )
      : [];

    setFilteredOrders(filtered);
  };

  // Initial fetch
  useEffect(() => {
    fetchOrders(1);
  }, [activeTab]);

  // Re-fetch when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchOrders(1, true);
    }, [activeTab])
  );

  // Apply search filter when search text changes
  useEffect(() => {
    filterOrders(orders, searchText);
  }, [searchText, orders]);

  // Handle tab change
  const handleTabChange = (tabId: React.SetStateAction<string>) => {
    setActiveTab(tabId);
    // Fetch will be triggered by useEffect
  };

  // Handle order press
  const handleOrderPress = (order: { _id: any }) => {
    navigation.navigate("OrderDetails", { orderId: order._id });
  };

  // Handle status update
  const handleUpdateStatus = (order: { _id: any }, newStatus: number) => {
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
              setLoading(true);

              // Update order status
              await orderService.updateOrderStatus(order._id, newStatus);

              // Update local state
              setOrders((prevOrders) =>
                prevOrders.map((o) =>
                  o._id === order._id
                    ? {
                        ...o,
                        status: newStatus,
                        statusUpdatedAt: new Date().toISOString(),
                      }
                    : o
                )
              );

              Alert.alert(
                "Success",
                `Order status updated to ${getStatusName(newStatus)}`
              );
            } catch (error) {
              console.error("Update status error:", error);
              Alert.alert("Error", "Failed to update order status");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(1, true);
  };

  // Load more when reaching the end of the list
  const handleLoadMore = () => {
    if (!loadingMore && !refreshing && pagination.page < pagination.pages) {
      fetchOrders(pagination.page + 1);
    }
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

  // Format date
  const formatDate = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Get next action for order
  const getNextAction = (order: { status: any }) => {
    switch (order.status) {
      case OrderStatus.Pending:
        return {
          title: "Confirm",
          status: OrderStatus.Confirmed,
          color: theme.colors.success,
        };
      case OrderStatus.Confirmed:
        return {
          title: "Prepare",
          status: OrderStatus.Preparing,
          color: theme.colors.secondary,
        };
      case OrderStatus.Preparing:
        return {
          title: "Ready",
          status: OrderStatus.ReadyForPickup,
          color: theme.colors.accent,
        };
      default:
        return null;
    }
  };

  // Render order item
  const renderOrderItem = ({ item }: any) => {
    const nextAction = getNextAction(item);

    return (
      <TouchableOpacity
        style={[styles.orderCard, { backgroundColor: theme.colors.card }]}
        onPress={() => handleOrderPress(item)}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={[styles.orderNumber, { color: theme.colors.text }]}>
              #{item.orderNumber}
            </Text>
            <Text style={[styles.orderTime, { color: theme.colors.darkGray }]}>
              {formatDate(item.created_at)}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + "20" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {getStatusName(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.orderContent}>
          <View style={styles.customerInfo}>
            <Icon name="account" size={16} color={theme.colors.darkGray} />
            <Text style={[styles.customerName, { color: theme.colors.text }]}>
              {item.customer?.name || "Customer"}
            </Text>
          </View>

          <View style={styles.itemsContainer}>
            <Text style={[styles.itemsTitle, { color: theme.colors.darkGray }]}>
              Items:
            </Text>
            <Text
              style={[styles.itemsList, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {item.items
                .map(
                  (orderItem: { quantity: any; name: any }) =>
                    `${orderItem.quantity}x ${orderItem.name}`
                )
                .join(", ")}
            </Text>
          </View>

          <View style={styles.orderFooter}>
            <Text style={[styles.orderTotal, { color: theme.colors.text }]}>
              Total: ${item.total.toFixed(2)}
            </Text>

            {item.status === OrderStatus.Pending && (
              <TouchableOpacity
                style={[
                  styles.rejectButton,
                  { borderColor: theme.colors.error },
                ]}
                onPress={() => handleUpdateStatus(item, OrderStatus.Rejected)}
              >
                <Text
                  style={[
                    styles.rejectButtonText,
                    { color: theme.colors.error },
                  ]}
                >
                  Reject
                </Text>
              </TouchableOpacity>
            )}

            {nextAction && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: nextAction.color },
                ]}
                onPress={() => handleUpdateStatus(item, nextAction.status)}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: theme.colors.white },
                  ]}
                >
                  {nextAction.title}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon
        name="receipt-text-outline"
        size={60}
        color={theme.colors.placeholder}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No orders found
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.darkGray }]}>
        {searchText
          ? `No results found for "${searchText}"`
          : activeTab === "all"
          ? "You don't have any orders yet"
          : `You don't have any ${ORDER_TABS.find(
              (tab) => tab.id === activeTab
            )?.label.toLowerCase()} orders`}
      </Text>
    </View>
  );

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
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View
            style={[styles.searchBar, { backgroundColor: theme.colors.gray }]}
          >
            <Icon name="magnify" size={20} color={theme.colors.placeholder} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search by order #, customer name"
              placeholderTextColor={theme.colors.placeholder}
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Icon
                  name="close-circle"
                  size={20}
                  color={theme.colors.darkGray}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Order Status Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
          >
            {ORDER_TABS.map((tab) => (
              <FilterChip
                key={tab.id}
                label={tab.label}
                active={activeTab === tab.id}
                onPress={() => handleTabChange(tab.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Orders List */}
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item: any) => item._id.toString()}
          contentContainerStyle={styles.listContent}
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listContent: {
    padding: 16,
  },
  orderCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  orderTime: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  orderContent: {
    padding: 12,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  customerName: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  itemsContainer: {
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  itemsList: {
    fontSize: 14,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "bold",
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  rejectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 8,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
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

export default OrdersScreen;
