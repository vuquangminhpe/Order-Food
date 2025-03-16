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
  TextInput,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { orderService, OrderStatus } from "../api/orderService";
import { useFocusEffect } from "@react-navigation/native";
import FilterChip from "../components/general/FilterChip";

// Filter options for history
const FILTERS = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
];

const DeliveryHistoryScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  // State
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch delivery history
  const fetchDeliveryHistory = async (page = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);

      // Set up date parameters based on active filter
      let params = { page, limit: pagination.limit } as any;

      const now = new Date();

      if (activeFilter === "today") {
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        params.startDate = today.toISOString();
      } else if (activeFilter === "week") {
        const lastWeek = new Date(now);
        lastWeek.setDate(now.getDate() - 7);
        params.startDate = lastWeek.toISOString();
      } else if (activeFilter === "month") {
        const lastMonth = new Date(now);
        lastMonth.setMonth(now.getMonth() - 1);
        params.startDate = lastMonth.toISOString();
      }

      // Fetch delivery history from API
      const response = await orderService.getDeliveryHistory(params);

      // Update deliveries list
      if (refresh || page === 1) {
        setDeliveries(response.deliveries);
      } else {
        setDeliveries((prev) => [...prev, ...response.deliveries]);
      }

      setPagination({
        ...response.pagination,
        page,
      });

      // Apply search and filter
      filterDeliveries(response.deliveries, searchText);
    } catch (err) {
      console.error("Error fetching delivery history:", err);
      setError("Failed to load delivery history. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Filter deliveries based on search text
  const filterDeliveries = (deliveriesList: any, search: any) => {
    if (!search.trim()) {
      setFilteredDeliveries(deliveriesList);
      return;
    }

    const filtered = deliveriesList.filter((delivery: any) => {
      const searchLower = search.toLowerCase();
      return (
        delivery.orderNumber.toLowerCase().includes(searchLower) ||
        delivery.restaurant?.name?.toLowerCase().includes(searchLower) ||
        delivery.customer?.name?.toLowerCase().includes(searchLower) ||
        delivery.customer?.address?.toLowerCase().includes(searchLower)
      );
    });

    setFilteredDeliveries(filtered);
  };

  // Initial fetch
  useEffect(() => {
    fetchDeliveryHistory(1);
  }, [activeFilter]);

  // Re-fetch when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchDeliveryHistory(1, true);
    }, [activeFilter])
  );

  // Apply search filter when search text changes
  useEffect(() => {
    filterDeliveries(deliveries, searchText);
  }, [searchText, deliveries]);

  // Handle filter change
  const handleFilterChange = (filterId: any) => {
    setActiveFilter(filterId);
    // Fetch will be triggered by useEffect
  };

  // Handle delivery press
  const handleDeliveryPress = (delivery: any) => {
    navigation.navigate("DeliveryOrderDetails", {
      orderId: delivery._id,
      order: delivery,
    });
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchDeliveryHistory(1, true);
  };

  // Load more when reaching the end of the list
  const handleLoadMore = () => {
    if (!loadingMore && !refreshing && pagination.page < pagination.pages) {
      fetchDeliveryHistory(pagination.page + 1);
    }
  };

  // Format date
  const formatDate = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format time
  const formatTime = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate delivery duration in minutes
  const calculateDuration = (
    pickup: string | number | Date,
    delivered: string | number | Date
  ) => {
    if (!pickup || !delivered) return null;

    const pickupTime = new Date(pickup).getTime();
    const deliveredTime = new Date(delivered).getTime();
    const diffMinutes = Math.round((deliveredTime - pickupTime) / 60000);

    return diffMinutes;
  };

  // Render delivery item
  const renderDeliveryItem = ({ item }: any) => {
    const deliveryDate = formatDate(item.created_at);
    const pickupTime = item.pickup_at ? formatTime(item.pickup_at) : "--:--";
    const deliveredTime = item.delivered_at
      ? formatTime(item.delivered_at)
      : "--:--";
    const duration = calculateDuration(item.pickup_at, item.delivered_at);

    return (
      <TouchableOpacity
        style={[styles.deliveryCard, { backgroundColor: theme.colors.card }]}
        onPress={() => handleDeliveryPress(item)}
      >
        <View style={styles.deliveryHeader}>
          <View style={styles.deliveryInfo}>
            <Text style={[styles.orderNumber, { color: theme.colors.text }]}>
              #{item.orderNumber}
            </Text>
            <Text
              style={[styles.deliveryDate, { color: theme.colors.darkGray }]}
            >
              {deliveryDate}
            </Text>
          </View>
          <Text style={[styles.deliveryAmount, { color: theme.colors.text }]}>
            ${item.deliveryFee.toFixed(2)}
          </Text>
        </View>

        <View style={styles.locationInfo}>
          <View style={styles.locationRow}>
            <MaterialCommunityIcons
              name="store"
              size={16}
              color={theme.colors.primary}
            />
            <Text style={[styles.locationText, { color: theme.colors.text }]}>
              {item.restaurant?.name || "Restaurant"}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="arrow-down"
            size={16}
            color={theme.colors.darkGray}
            style={styles.arrowIcon}
          />
          <View style={styles.locationRow}>
            <MaterialCommunityIcons
              name="map-marker"
              size={16}
              color={theme.colors.secondary}
            />
            <Text style={[styles.locationText, { color: theme.colors.text }]}>
              {item.customer?.address || "Customer Address"}
            </Text>
          </View>
        </View>

        <View style={styles.deliveryFooter}>
          <View style={styles.timeInfo}>
            <View style={styles.timeItem}>
              <Text
                style={[styles.timeLabel, { color: theme.colors.darkGray }]}
              >
                Pickup
              </Text>
              <Text style={[styles.timeValue, { color: theme.colors.text }]}>
                {pickupTime}
              </Text>
            </View>

            <View style={styles.timeItem}>
              <Text
                style={[styles.timeLabel, { color: theme.colors.darkGray }]}
              >
                Delivered
              </Text>
              <Text style={[styles.timeValue, { color: theme.colors.text }]}>
                {deliveredTime}
              </Text>
            </View>

            {duration && (
              <View style={styles.timeItem}>
                <Text
                  style={[styles.timeLabel, { color: theme.colors.darkGray }]}
                >
                  Duration
                </Text>
                <Text style={[styles.timeValue, { color: theme.colors.text }]}>
                  {duration} min
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.detailsButton,
              { borderColor: theme.colors.primary },
            ]}
            onPress={() => handleDeliveryPress(item)}
          >
            <Text
              style={[
                styles.detailsButtonText,
                { color: theme.colors.primary },
              ]}
            >
              Details
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={14}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="history"
        size={60}
        color={theme.colors.placeholder}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No delivery history
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.darkGray }]}>
        {searchText
          ? `No results found for "${searchText}"`
          : activeFilter === "all"
          ? "You don't have any delivery history yet"
          : `You don't have any deliveries ${
              activeFilter === "today"
                ? "today"
                : activeFilter === "week"
                ? "this week"
                : "this month"
            }`}
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
          Loading more deliveries...
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
          Loading delivery history...
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
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={theme.colors.placeholder}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search orders, restaurants..."
              placeholderTextColor={theme.colors.placeholder}
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={20}
                  color={theme.colors.darkGray}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {FILTERS.map((filter) => (
              <FilterChip
                key={filter.id}
                label={filter.label}
                active={activeFilter === filter.id}
                onPress={() => handleFilterChange(filter.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Deliveries List */}
        <FlatList
          data={filteredDeliveries}
          renderItem={renderDeliveryItem}
          keyExtractor={(item: any) => item._id}
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
              onPress={() => fetchDeliveryHistory(1, true)}
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
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listContent: {
    padding: 16,
  },
  deliveryCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  deliveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  deliveryInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
  },
  deliveryDate: {
    fontSize: 12,
    marginTop: 2,
  },
  deliveryAmount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  locationInfo: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  locationText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  arrowIcon: {
    marginLeft: 8,
    marginVertical: 2,
  },
  deliveryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeInfo: {
    flexDirection: "row",
    flex: 1,
  },
  timeItem: {
    marginRight: 16,
  },
  timeLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 12,
    fontWeight: "500",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: "500",
    marginRight: 4,
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

export default DeliveryHistoryScreen;
