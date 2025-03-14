import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

const NotificationsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  // State
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setError(null);
      if (!refreshing) {
        setLoading(true);
      }

      // In a real app, you would call an API to get notifications
      // For demonstration, we'll use mock data
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockNotifications = [
        {
          id: "1",
          type: "order",
          title: "New Order Received",
          message: "You have received a new order #ORD-1234 for delivery.",
          read: false,
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        },
        {
          id: "2",
          type: "status",
          title: "Order Status Updated",
          message:
            "Order #ORD-5678 has been confirmed and is now being prepared.",
          read: false,
          timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
        },
        {
          id: "3",
          type: "delivery",
          title: "Order Delivered",
          message:
            "Order #ORD-9876 has been successfully delivered to the customer.",
          read: true,
          timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
        },
        {
          id: "4",
          type: "payment",
          title: "Payment Received",
          message: "You have received a payment of $45.50 for order #ORD-5432.",
          read: true,
          timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
        {
          id: "5",
          type: "system",
          title: "System Maintenance",
          message:
            "The app will undergo maintenance tonight from 2 AM to 4 AM. Some features may be unavailable during this time.",
          read: true,
          timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
      ];

      setNotifications(mockNotifications);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );

    // In a real app, you would call an API to update the notification status
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({ ...notification, read: true }))
    );

    // In a real app, you would call an API to update all notifications
  };

  // Delete notification
  const deleteNotification = (id) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setNotifications(
              notifications.filter((notification) => notification.id !== id)
            );

            // In a real app, you would call an API to delete the notification
          },
        },
      ]
    );
  };

  // Handle notification press
  const handleNotificationPress = (notification) => {
    // Mark as read
    markAsRead(notification.id);

    // Navigate based on notification type
    switch (notification.type) {
      case "order":
        // Extract order ID from message (this is a simple example)
        const orderMatch = notification.message.match(/#(ORD-\d+)/);
        if (orderMatch && orderMatch[1]) {
          const orderId = orderMatch[1];
          // Navigate to appropriate screen based on user role
          if (user?.role === 1) {
            // Restaurant owner
            navigation.navigate("OrderDetails", { orderId });
          } else if (user?.role === 2) {
            // Delivery person
            navigation.navigate("DeliveryOrderDetails", { orderId });
          } else {
            // Customer
            navigation.navigate("OrderDetails", { orderId });
          }
        }
        break;
      case "status":
      case "delivery":
        // Similar to order handling
        break;
      case "payment":
        // Navigate to payment details or history
        break;
      case "system":
        // No navigation for system notifications
        break;
      default:
        break;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) {
      return diffDay === 1 ? "Yesterday" : `${diffDay} days ago`;
    } else if (diffHour > 0) {
      return `${diffHour} ${diffHour === 1 ? "hour" : "hours"} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} ${diffMin === 1 ? "minute" : "minutes"} ago`;
    } else {
      return "Just now";
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "order":
        return "receipt";
      case "status":
        return "clipboard-list";
      case "delivery":
        return "truck-delivery";
      case "payment":
        return "cash";
      case "system":
        return "information";
      default:
        return "bell";
    }
  };

  // Get icon color for notification type
  const getIconColor = (type) => {
    switch (type) {
      case "order":
        return theme.colors.primary;
      case "status":
        return theme.colors.info;
      case "delivery":
        return theme.colors.success;
      case "payment":
        return theme.colors.accent;
      case "system":
        return theme.colors.warning;
      default:
        return theme.colors.darkGray;
    }
  };

  // Render notification item
  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        {
          backgroundColor: item.read
            ? theme.colors.background
            : theme.colors.highlight,
        },
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: getIconColor(item.type) + "20" },
        ]}
      >
        <Icon
          name={getNotificationIcon(item.type)}
          size={20}
          color={getIconColor(item.type)}
        />
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text
            style={[
              styles.notificationTitle,
              {
                color: theme.colors.text,
                fontWeight: item.read ? "normal" : "bold",
              },
            ]}
          >
            {item.title}
          </Text>
          <Text style={[styles.timestamp, { color: theme.colors.darkGray }]}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>

        <Text
          style={[styles.notificationMessage, { color: theme.colors.text }]}
          numberOfLines={2}
        >
          {item.message}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteNotification(item.id)}
      >
        <Icon name="delete-outline" size={20} color={theme.colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="bell-off" size={60} color={theme.colors.placeholder} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No Notifications
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.darkGray }]}>
        You don't have any notifications yet. We'll notify you of important
        updates here.
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
          Loading notifications...
        </Text>
      </View>
    );
  }

  // Count unread notifications
  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {/* Header with action buttons */}
        {notifications.length > 0 && (
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                Notifications
              </Text>
              {unreadCount > 0 && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Text
                    style={[styles.badgeText, { color: theme.colors.white }]}
                  >
                    {unreadCount}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { borderColor: theme.colors.primary },
              ]}
              onPress={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  {
                    color:
                      unreadCount === 0
                        ? theme.colors.placeholder
                        : theme.colors.primary,
                  },
                ]}
              >
                Mark All as Read
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notifications List */}
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
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
              onPress={() => fetchNotifications()}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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

export default NotificationsScreen;
