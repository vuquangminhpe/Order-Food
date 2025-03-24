import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  FlatList,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { orderService, OrderStatus } from "../api/orderService";

const PERIODS = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "year", label: "This Year" },
];

const DeliveryEarningsScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [earningsData, setEarningsData] = useState<any | null>(null);
  const [activePeriod, setActivePeriod] = useState<
    "today" | "week" | "month" | "year"
  >("week");

  const fetchEarningsData = async () => {
    try {
      setError(null);
      if (!refreshing) {
        setLoading(true);
      }
      const now = new Date();
      let startDate = new Date();

      if (activePeriod === "today") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (activePeriod === "week") {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
      } else if (activePeriod === "month") {
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
      } else if (activePeriod === "year") {
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
      }

      const historyParams = {
        startDate: startDate.toISOString(),
        limit: 100,
        page: 1,
      };

      const deliveryHistoryResponse = await orderService.getDeliveryHistory(
        historyParams
      );
      const deliveries = deliveryHistoryResponse.orders || [];

      // Calculate earnings from the delivery history
      const calculatedEarnings = calculateEarningsFromHistory(
        deliveries,
        activePeriod,
        startDate
      );

      setEarningsData(calculatedEarnings);
    } catch (err) {
      console.error("Error fetching earnings data:", err);
      setError("Failed to load earnings data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate earnings from delivery history
  const calculateEarningsFromHistory = (
    deliveries: any[],
    period: string,
    startDate: Date
  ) => {
    // Filter completed deliveries
    const completedDeliveries = deliveries.filter(
      (delivery) => delivery.orderStatus === OrderStatus.Delivered
    );

    // Calculate total earnings for the period
    const totalEarnings = completedDeliveries.reduce(
      (total, delivery) => total + (delivery.deliveryFee || 0),
      0
    );

    // Calculate pending payments (orders that are out for delivery but not yet delivered)
    const pendingDeliveries = deliveries.filter(
      (delivery) => delivery.orderStatus === OrderStatus.OutForDelivery
    );
    const pendingPayment = pendingDeliveries.reduce(
      (total, delivery) => total + (delivery.deliveryFee || 0),
      0
    );

    // Calculate earnings for different periods
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const todayEarnings = completedDeliveries
      .filter((delivery) => new Date(delivery.created_at) >= todayStart)
      .reduce((total, delivery) => total + (delivery.deliveryFee || 0), 0);

    const weekEarnings = completedDeliveries
      .filter((delivery) => new Date(delivery.created_at) >= weekStart)
      .reduce((total, delivery) => total + (delivery.deliveryFee || 0), 0);

    const monthEarnings = completedDeliveries
      .filter((delivery) => new Date(delivery.created_at) >= monthStart)
      .reduce((total, delivery) => total + (delivery.deliveryFee || 0), 0);

    // Create daily data for the chart
    // For week view, show last 7 days
    const weeklyChartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayEarnings = completedDeliveries
        .filter(
          (delivery) =>
            new Date(delivery.created_at) >= date &&
            new Date(delivery.created_at) < nextDay
        )
        .reduce((total, delivery) => total + (delivery.deliveryFee || 0), 0);

      const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
        date.getDay()
      ];

      weeklyChartData.push({
        day: dayName,
        amount: dayEarnings,
      });
    }

    // Format the delivery history for display
    const earningsHistory = completedDeliveries.map((delivery) => ({
      id: delivery._id,
      date: delivery.created_at,
      amount: delivery.deliveryFee || 0,
      orders: 1,
      status: "Paid",
      paymentDate: delivery.updated_at,
    }));

    return {
      today: todayEarnings,
      week: weekEarnings,
      month: monthEarnings,
      pendingPayment,
      earnings: earningsHistory,
      weeklyChart: weeklyChartData,
    };
  };

  // Initial fetch
  useEffect(() => {
    fetchEarningsData();
  }, [activePeriod]);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchEarningsData();
  };

  // Handle period change
  const handlePeriodChange = (period: any) => {
    setActivePeriod(period);
  };

  // Format date
  const formatDate = (dateString: any) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get max value in chart data for scaling
  const getMaxValue = (data: any[]) => {
    return (
      Math.max(...data.map((item: { amount: any }) => item.amount)) * 1.2 || 10
    ); // Add 20% buffer, default to 10 if all values are 0
  };

  // Render chart
  const renderChart = (data: any[]) => {
    if (!data || data.length === 0) return null;

    const maxValue = getMaxValue(data);

    return (
      <View style={styles.chartContainer}>
        {data.map(
          (
            item: {
              amount: number;
              day:
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
            },
            index: React.Key | null | undefined
          ) => (
            <View key={index} style={styles.chartColumn}>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${Math.max((item.amount / maxValue) * 100, 1)}%`,
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.barLabel, { color: theme.colors.darkGray }]}>
                {item.day}
              </Text>
            </View>
          )
        )}
      </View>
    );
  };

  // Render earnings list item
  const renderEarningsItem = ({ item }: any) => (
    <View
      style={[styles.earningsItem, { borderBottomColor: theme.colors.border }]}
    >
      <View style={styles.earningsItemLeft}>
        <Text style={[styles.earningsItemDate, { color: theme.colors.text }]}>
          {formatDate(item.date)}
        </Text>
        <Text
          style={[styles.earningsItemInfo, { color: theme.colors.darkGray }]}
        >
          {item.orders} {item.orders === 1 ? "order" : "orders"}
        </Text>
      </View>
      <View style={styles.earningsItemRight}>
        <Text style={[styles.earningsItemAmount, { color: theme.colors.text }]}>
          ${item.amount.toFixed(2)}
        </Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === "Paid"
                  ? theme.colors.success + "20"
                  : theme.colors.warning + "20",
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  item.status === "Paid"
                    ? theme.colors.success
                    : theme.colors.warning,
              },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>
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
          Loading earnings data...
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
        {/* Period Tabs */}
        <View style={styles.periodContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.periodScrollContent}
          >
            {PERIODS.map((period) => (
              <TouchableOpacity
                key={period.id}
                style={[
                  styles.periodTab,
                  activePeriod === period.id && [
                    styles.activePeriodTab,
                    { borderColor: theme.colors.primary },
                  ],
                ]}
                onPress={() => handlePeriodChange(period.id)}
              >
                <Text
                  style={[
                    styles.periodText,
                    {
                      color:
                        activePeriod === period.id
                          ? theme.colors.primary
                          : theme.colors.text,
                    },
                  ]}
                >
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Main content scrollview */}
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {earningsData && (
            <>
              {/* Earnings summary cards */}
              <View style={styles.summaryContainer}>
                <View
                  style={[
                    styles.summaryCard,
                    { backgroundColor: theme.colors.card },
                  ]}
                >
                  <View style={styles.summaryContent}>
                    <Text
                      style={[
                        styles.summaryLabel,
                        { color: theme.colors.darkGray },
                      ]}
                    >
                      {activePeriod === "today"
                        ? "Today's Earnings"
                        : activePeriod === "week"
                        ? "This Week"
                        : activePeriod === "month"
                        ? "This Month"
                        : "This Year"}
                    </Text>
                    <Text
                      style={[
                        styles.summaryAmount,
                        { color: theme.colors.text },
                      ]}
                    >
                      $
                      {earningsData[
                        activePeriod as "today" | "week" | "month"
                      ].toFixed(2)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.colors.primary + "20" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="cash"
                      size={24}
                      color={theme.colors.primary}
                    />
                  </View>
                </View>

                <View
                  style={[
                    styles.summaryCard,
                    { backgroundColor: theme.colors.card },
                  ]}
                >
                  <View style={styles.summaryContent}>
                    <Text
                      style={[
                        styles.summaryLabel,
                        { color: theme.colors.darkGray },
                      ]}
                    >
                      Pending Payment
                    </Text>
                    <Text
                      style={[
                        styles.summaryAmount,
                        { color: theme.colors.text },
                      ]}
                    >
                      ${earningsData.pendingPayment.toFixed(2)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.colors.warning + "20" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={24}
                      color={theme.colors.warning}
                    />
                  </View>
                </View>
              </View>

              {/* Weekly earnings chart */}
              <View
                style={[
                  styles.chartCard,
                  { backgroundColor: theme.colors.card },
                ]}
              >
                <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
                  Weekly Earnings
                </Text>
                {renderChart(earningsData.weeklyChart)}
              </View>

              {/* Earnings history */}
              <View
                style={[
                  styles.historyCard,
                  { backgroundColor: theme.colors.card },
                ]}
              >
                <View style={styles.historyHeader}>
                  <Text
                    style={[styles.historyTitle, { color: theme.colors.text }]}
                  >
                    Earnings History
                  </Text>
                  <TouchableOpacity>
                    <Text
                      style={[
                        styles.historyLink,
                        { color: theme.colors.primary },
                      ]}
                    >
                      View All
                    </Text>
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={earningsData.earnings.slice(0, 5)}
                  renderItem={renderEarningsItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </View>

              {/* Payment Methods Button */}
              <TouchableOpacity
                style={[
                  styles.paymentMethodButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => {}}
              >
                <MaterialCommunityIcons
                  name="credit-card"
                  size={20}
                  color={theme.colors.white}
                />
                <Text
                  style={[
                    styles.paymentMethodText,
                    { color: theme.colors.white },
                  ]}
                >
                  Manage Payment Methods
                </Text>
              </TouchableOpacity>
            </>
          )}

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
              onPress={fetchEarningsData}
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
  periodContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  periodScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  periodTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    marginHorizontal: 4,
  },
  activePeriodTab: {
    backgroundColor: "rgba(255,90,95,0.1)",
  },
  periodText: {
    fontSize: 14,
    fontWeight: "500",
  },
  summaryContainer: {
    flexDirection: "row",
    padding: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: "bold",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  chartCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  chartContainer: {
    height: 180,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingTop: 20,
  },
  chartColumn: {
    flex: 1,
    alignItems: "center",
  },
  barContainer: {
    width: "60%",
    height: 150,
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: {
    fontSize: 12,
    marginTop: 8,
  },
  historyCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  historyLink: {
    fontSize: 14,
  },
  earningsItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  earningsItemLeft: {
    flex: 1,
  },
  earningsItemDate: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  earningsItemInfo: {
    fontSize: 12,
  },
  earningsItemRight: {
    alignItems: "flex-end",
  },
  earningsItemAmount: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "500",
  },
  paymentMethodButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
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

export default DeliveryEarningsScreen;
