import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { restaurantService } from "../api/restaurantService";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";

const { width } = Dimensions.get("window");
const chartWidth = width - 32;

const AnalyticsScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("week"); // 'day', 'week', 'month', 'year'
  const [analytics, setAnalytics] = useState<{
    revenue: {
      data: number[];
      labels?: string[];
      total: number;
      change: number | string;
    };
    orders: {
      data: number[];
      labels?: string[];
      total: number;
      change: number | string;
    };
    items: { name: string; quantity: number; revenue: number }[];
    categories: { name: string; sales: number; color: string }[];
    customers: {
      new: number;
      returning: number;
      total: number;
    };
  }>({
    revenue: {
      data: [],
      total: 0,
      change: 0,
    },
    orders: {
      data: [],
      total: 0,
      change: 0,
    },
    items: [],
    categories: [],
    customers: {
      new: 0,
      returning: 0,
      total: 0,
    },
  });

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setError(null);
      if (!refreshing) {
        setLoading(true);
      }

      // Get restaurant ID from user
      const restaurantId = (user as any)?.restaurantId || "1"; // Fallback to a default ID for demo

      // In a real app, you would fetch analytics from your backend
      // For demonstration, we'll use mock data

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock revenue data
      let revenueData;
      let ordersData;
      let labels;

      switch (timeRange) {
        case "day":
          labels = ["8AM", "10AM", "12PM", "2PM", "4PM", "6PM", "8PM"];
          revenueData = [150, 280, 420, 350, 290, 380, 450];
          ordersData = [5, 10, 15, 12, 8, 14, 16];
          break;
        case "week":
          labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          revenueData = [1200, 950, 1100, 1400, 1600, 2200, 1800];
          ordersData = [40, 35, 42, 50, 55, 70, 60];
          break;
        case "month":
          labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
          revenueData = [5800, 6200, 5900, 6800];
          ordersData = [190, 210, 185, 230];
          break;
        case "year":
          labels = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          revenueData = [
            18000, 19500, 22000, 24000, 20500, 21000, 23500, 25000, 27000,
            26000, 28000, 30000,
          ];
          ordersData = [
            620, 650, 700, 750, 680, 690, 720, 780, 820, 800, 840, 900,
          ];
          break;
        default:
          labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          revenueData = [1200, 950, 1100, 1400, 1600, 2200, 1800];
          ordersData = [40, 35, 42, 50, 55, 70, 60];
      }

      // Calculate totals and changes
      const revenueTotal = revenueData.reduce((sum, val) => sum + val, 0);
      const revenueChange =
        Math.random() > 0.5
          ? (Math.random() * 20).toFixed(1)
          : -(Math.random() * 15).toFixed(1);

      const ordersTotal = ordersData.reduce((sum, val) => sum + val, 0);
      const ordersChange =
        Math.random() > 0.5
          ? (Math.random() * 20).toFixed(1)
          : -(Math.random() * 15).toFixed(1);

      // Top selling items
      const topItems = [
        {
          name: "Burger Deluxe",
          quantity: Math.floor(Math.random() * 50) + 30,
          revenue: Math.floor(Math.random() * 1000) + 500,
        },
        {
          name: "French Fries",
          quantity: Math.floor(Math.random() * 40) + 20,
          revenue: Math.floor(Math.random() * 800) + 300,
        },
        {
          name: "Chicken Wings",
          quantity: Math.floor(Math.random() * 30) + 15,
          revenue: Math.floor(Math.random() * 700) + 200,
        },
        {
          name: "Coca Cola",
          quantity: Math.floor(Math.random() * 50) + 25,
          revenue: Math.floor(Math.random() * 500) + 100,
        },
        {
          name: "Veggie Salad",
          quantity: Math.floor(Math.random() * 20) + 10,
          revenue: Math.floor(Math.random() * 600) + 150,
        },
      ];

      // Category breakdown
      const categories = [
        {
          name: "Burgers",
          sales: Math.floor(Math.random() * 100) + 50,
          color: "#FF6384",
        },
        {
          name: "Drinks",
          sales: Math.floor(Math.random() * 80) + 40,
          color: "#36A2EB",
        },
        {
          name: "Sides",
          sales: Math.floor(Math.random() * 60) + 30,
          color: "#FFCE56",
        },
        {
          name: "Desserts",
          sales: Math.floor(Math.random() * 40) + 20,
          color: "#4BC0C0",
        },
        {
          name: "Salads",
          sales: Math.floor(Math.random() * 30) + 10,
          color: "#9966FF",
        },
      ];

      // Customer data
      const customers = {
        new: Math.floor(Math.random() * 50) + 20,
        returning: Math.floor(Math.random() * 100) + 50,
        total: Math.floor(Math.random() * 150) + 70,
      };

      setAnalytics({
        revenue: {
          data: revenueData,
          labels,
          total: revenueTotal,
          change: revenueChange,
        },
        orders: {
          data: ordersData,
          labels,
          total: ordersTotal,
          change: ordersChange,
        },
        items: topItems,
        categories,
        customers,
      });
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError("Failed to load analytics data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  // Handle time range change
  const handleTimeRangeChange = (range: React.SetStateAction<string>) => {
    setTimeRange(range);
  };

  // Chart configurations
  const lineChartConfig = {
    backgroundColor: "transparent",
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.colors.primary,
    labelColor: (opacity = 1) => theme.colors.text,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: theme.colors.primary,
    },
  };

  const barChartConfig = {
    backgroundColor: "transparent",
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.colors.info,
    labelColor: (opacity = 1) => theme.colors.text,
    style: {
      borderRadius: 16,
    },
    barPercentage: 0.6,
  };

  const pieChartConfig = {
    backgroundColor: "transparent",
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.colors.text,
    labelColor: (opacity = 1) => theme.colors.text,
    style: {
      borderRadius: 16,
    },
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString("en-US")}`;
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
          Loading analytics...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {["day", "week", "month", "year"].map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                timeRange === range && {
                  backgroundColor: theme.colors.primary,
                },
              ]}
              onPress={() => handleTimeRangeChange(range)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  {
                    color:
                      timeRange === range
                        ? theme.colors.white
                        : theme.colors.text,
                  },
                ]}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          {/* Revenue Card */}
          <View
            style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}
          >
            <View style={styles.summaryHeaderRow}>
              <Text
                style={[styles.summaryLabel, { color: theme.colors.darkGray }]}
              >
                Revenue
              </Text>
              <View
                style={[
                  styles.changeIndicator,
                  {
                    backgroundColor:
                      parseFloat(analytics.revenue.change as string) >= 0
                        ? theme.colors.success + "20"
                        : theme.colors.error + "20",
                  },
                ]}
              >
                <Icon
                  name={
                    parseFloat(analytics.revenue.change as string) >= 0
                      ? "arrow-up"
                      : "arrow-down"
                  }
                  size={12}
                  color={
                    parseFloat(analytics.revenue.change as string) >= 0
                      ? theme.colors.success
                      : theme.colors.error
                  }
                />
                <Text
                  style={[
                    styles.changeText,
                    {
                      color:
                        parseFloat(analytics.revenue.change as string) >= 0
                          ? theme.colors.success
                          : theme.colors.error,
                    },
                  ]}
                >
                  {Math.abs(parseFloat(analytics.revenue.change as string))}%
                </Text>
              </View>
            </View>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
              {formatCurrency(analytics.revenue.total)}
            </Text>
            <Text
              style={[styles.summarySubtext, { color: theme.colors.darkGray }]}
            >
              Total for this {timeRange}
            </Text>
          </View>

          {/* Orders Card */}
          <View
            style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}
          >
            <View style={styles.summaryHeaderRow}>
              <Text
                style={[styles.summaryLabel, { color: theme.colors.darkGray }]}
              >
                Orders
              </Text>
              <View
                style={[
                  styles.changeIndicator,
                  {
                    backgroundColor:
                      parseFloat(analytics.orders.change as string) >= 0
                        ? theme.colors.success + "20"
                        : theme.colors.error + "20",
                  },
                ]}
              >
                <Icon
                  name={
                    parseFloat(analytics.orders.change as string) >= 0
                      ? "arrow-up"
                      : "arrow-down"
                  }
                  size={12}
                  color={
                    parseFloat(analytics.orders.change as string) >= 0
                      ? theme.colors.success
                      : theme.colors.error
                  }
                />
                <Text
                  style={[
                    styles.changeText,
                    {
                      color:
                        parseFloat(analytics.orders.change as string) >= 0
                          ? theme.colors.success
                          : theme.colors.error,
                    },
                  ]}
                >
                  {Math.abs(parseFloat(analytics.orders.change as string))}%
                </Text>
              </View>
            </View>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
              {analytics.orders.total}
            </Text>
            <Text
              style={[styles.summarySubtext, { color: theme.colors.darkGray }]}
            >
              Total for this {timeRange}
            </Text>
          </View>
        </View>

        {/* Revenue Chart */}
        <View style={styles.chartContainer}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
            Revenue Trend
          </Text>
          {analytics.revenue.data.length > 0 && (
            <LineChart
              data={{
                labels: analytics.revenue.labels as any,
                datasets: [
                  {
                    data: analytics.revenue.data,
                  },
                ],
              }}
              width={chartWidth}
              height={220}
              chartConfig={lineChartConfig}
              bezier
              style={styles.chart}
            />
          )}
        </View>

        {/* Orders Chart */}
        <View style={styles.chartContainer}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
            Order Volume
          </Text>
          {analytics.orders.data.length > 0 && (
            <BarChart
              data={{
                labels: analytics.orders.labels as any,
                datasets: [
                  {
                    data: analytics.orders.data,
                  },
                ],
              }}
              width={chartWidth}
              height={220}
              chartConfig={barChartConfig}
              style={styles.chart}
              showValuesOnTopOfBars
              yAxisLabel="$"
              yAxisSuffix=""
            />
          )}
        </View>

        {/* Top Items */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Top Selling Items
          </Text>
          {analytics.items.map((item, index) => (
            <View
              key={index}
              style={[
                styles.itemRow,
                {
                  backgroundColor: theme.colors.card,
                  borderBottomColor:
                    index < analytics.items.length - 1
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
                <Text
                  style={[styles.itemStats, { color: theme.colors.darkGray }]}
                >
                  {item.quantity} sold · {formatCurrency(item.revenue)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Categories Chart */}
        <View style={styles.chartContainer}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
            Sales by Category
          </Text>
          <PieChart
            data={analytics.categories.map((cat) => ({
              name: cat.name,
              population: cat.sales,
              color: cat.color,
              legendFontColor: theme.colors.text,
              legendFontSize: 12,
            }))}
            width={chartWidth}
            height={220}
            chartConfig={pieChartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>

        {/* Customer Insights */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Customer Insights
          </Text>
          <View
            style={[
              styles.customersCard,
              { backgroundColor: theme.colors.card },
            ]}
          >
            <View style={styles.customerSegment}>
              <View
                style={[
                  styles.customerIndicator,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
              <View style={styles.customerInfo}>
                <Text
                  style={[
                    styles.customerLabel,
                    { color: theme.colors.darkGray },
                  ]}
                >
                  New Customers
                </Text>
                <Text
                  style={[styles.customerValue, { color: theme.colors.text }]}
                >
                  {analytics.customers.new}
                </Text>
              </View>
            </View>

            <View style={styles.customerSegment}>
              <View
                style={[
                  styles.customerIndicator,
                  { backgroundColor: theme.colors.secondary },
                ]}
              />
              <View style={styles.customerInfo}>
                <Text
                  style={[
                    styles.customerLabel,
                    { color: theme.colors.darkGray },
                  ]}
                >
                  Returning Customers
                </Text>
                <Text
                  style={[styles.customerValue, { color: theme.colors.text }]}
                >
                  {analytics.customers.returning}
                </Text>
              </View>
            </View>

            <View style={styles.customerSegment}>
              <View
                style={[
                  styles.customerIndicator,
                  { backgroundColor: theme.colors.info },
                ]}
              />
              <View style={styles.customerInfo}>
                <Text
                  style={[
                    styles.customerLabel,
                    { color: theme.colors.darkGray },
                  ]}
                >
                  Total Customers
                </Text>
                <Text
                  style={[styles.customerValue, { color: theme.colors.text }]}
                >
                  {analytics.customers.total}
                </Text>
              </View>
            </View>
          </View>
        </View>

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
              onPress={() => fetchAnalytics()}
            >
              <Text
                style={[styles.retryButtonText, { color: theme.colors.white }]}
              >
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom padding */}
        <View style={{ height: 20 }} />
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
  timeRangeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timeRangeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  summaryCard: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  changeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  changeText: {
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 2,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 12,
  },
  chartContainer: {
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  chart: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sectionContainer: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
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
    marginBottom: 2,
  },
  itemStats: {
    fontSize: 12,
  },
  customersCard: {
    padding: 16,
    borderRadius: 12,
  },
  customerSegment: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  customerIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  customerValue: {
    fontSize: 16,
    fontWeight: "bold",
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

export default AnalyticsScreen;
