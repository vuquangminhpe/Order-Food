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
import { orderService } from "../api/orderService";

// Mock data for earnings statistics
const mockEarningsData = {
  today: 45.5,
  week: 320.75,
  month: 1250.3,
  pendingPayment: 165.8,
  earnings: [
    {
      id: "1",
      date: "2023-07-15",
      amount: 42.5,
      orders: 5,
      status: "Paid",
      paymentDate: "2023-07-16",
    },
    {
      id: "2",
      date: "2023-07-14",
      amount: 38.25,
      orders: 4,
      status: "Paid",
      paymentDate: "2023-07-15",
    },
    {
      id: "3",
      date: "2023-07-13",
      amount: 51.75,
      orders: 6,
      status: "Paid",
      paymentDate: "2023-07-14",
    },
    {
      id: "4",
      date: "2023-07-12",
      amount: 29.8,
      orders: 3,
      status: "Paid",
      paymentDate: "2023-07-13",
    },
    {
      id: "5",
      date: "2023-07-11",
      amount: 45.2,
      orders: 5,
      status: "Paid",
      paymentDate: "2023-07-12",
    },
    {
      id: "6",
      date: "2023-07-10",
      amount: 33.4,
      orders: 4,
      status: "Paid",
      paymentDate: "2023-07-11",
    },
    {
      id: "7",
      date: "2023-07-09",
      amount: 47.6,
      orders: 5,
      status: "Paid",
      paymentDate: "2023-07-10",
    },
  ],
  weeklyChart: [
    { day: "Mon", amount: 45.2 },
    { day: "Tue", amount: 33.4 },
    { day: "Wed", amount: 47.6 },
    { day: "Thu", amount: 29.8 },
    { day: "Fri", amount: 51.75 },
    { day: "Sat", amount: 38.25 },
    { day: "Sun", amount: 42.5 },
  ],
};

// Periods for filtering earnings
const PERIODS = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "year", label: "This Year" },
];

const DeliveryEarningsScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [earningsData, setEarningsData] = useState<
    typeof mockEarningsData | null
  >(null);
  const [activePeriod, setActivePeriod] = useState<
    "today" | "week" | "month" | "year"
  >("week");

  // Fetch earnings data
  const fetchEarningsData = async () => {
    try {
      setError(null);
      if (!refreshing) {
        setLoading(true);
      }

      // In a real app, you would call an API to get earnings data
      // For demonstration, we'll use mock data
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setEarningsData(mockEarningsData as any);
    } catch (err) {
      console.error("Error fetching earnings data:", err);
      setError("Failed to load earnings data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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
    return Math.max(...data.map((item: { amount: any }) => item.amount)) * 1.2; // Add 20% buffer
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
                      height: `${(item.amount / maxValue) * 100}%`,
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
