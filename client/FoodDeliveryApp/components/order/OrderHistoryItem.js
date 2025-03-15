import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../contexts/ThemeContext";
import moment from "moment";

// Order status constants for consistent styling
const ORDER_STATUS = {
  PENDING: 0,
  CONFIRMED: 1,
  PREPARING: 2,
  READY_FOR_PICKUP: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
  CANCELLED: 6,
  REJECTED: 7,
};

// Helper function to get status text and color
const getStatusInfo = (status, theme) => {
  switch (status) {
    case ORDER_STATUS.PENDING:
      return {
        text: "Pending",
        color: theme.colors.warning,
        icon: "clock-outline",
      };
    case ORDER_STATUS.CONFIRMED:
      return {
        text: "Confirmed",
        color: theme.colors.info,
        icon: "check-circle-outline",
      };
    case ORDER_STATUS.PREPARING:
      return { text: "Preparing", color: theme.colors.info, icon: "food" };
    case ORDER_STATUS.READY_FOR_PICKUP:
      return {
        text: "Ready for Pickup",
        color: theme.colors.info,
        icon: "package-variant-closed",
      };
    case ORDER_STATUS.OUT_FOR_DELIVERY:
      return {
        text: "Out for Delivery",
        color: theme.colors.info,
        icon: "bike",
      };
    case ORDER_STATUS.DELIVERED:
      return {
        text: "Delivered",
        color: theme.colors.success,
        icon: "check-circle",
      };
    case ORDER_STATUS.CANCELLED:
      return {
        text: "Cancelled",
        color: theme.colors.error,
        icon: "close-circle",
      };
    case ORDER_STATUS.REJECTED:
      return {
        text: "Rejected",
        color: theme.colors.error,
        icon: "close-circle",
      };
    default:
      return {
        text: "Unknown",
        color: theme.colors.darkGray,
        icon: "help-circle-outline",
      };
  }
};

const OrderHistoryItem = ({ order, onPress }) => {
  const { theme } = useTheme();

  // Get status styling info
  const statusInfo = getStatusInfo(order.orderStatus, theme);

  // Format date
  const formattedDate = moment(order.created_at).format("MMM D, YYYY • h:mm A");

  // Get item count
  const itemCount = order.items ? order.items.length : 0;

  return (
    <TouchableOpacity
      style={[styles.container, { borderColor: theme.colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Order header with order ID and status */}
      <View style={styles.header}>
        <View style={styles.orderNumberContainer}>
          <Text style={[styles.orderLabel, { color: theme.colors.darkGray }]}>
            Order #
          </Text>
          <Text style={[styles.orderNumber, { color: theme.colors.text }]}>
            {order.orderNumber || "..."}
          </Text>
        </View>

        <View
          style={[
            styles.statusContainer,
            { backgroundColor: `${statusInfo.color}20` },
          ]}
        >
          <Icon
            name={statusInfo.icon}
            size={14}
            color={statusInfo.color}
            style={styles.statusIcon}
          />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
        </View>
      </View>

      {/* Restaurant info */}
      <View style={styles.restaurantContainer}>
        <Image
          source={{
            uri:
              order.restaurant?.logoImage || "https://via.placeholder.com/60",
          }}
          style={styles.restaurantLogo}
        />

        <View style={styles.restaurantInfo}>
          <Text style={[styles.restaurantName, { color: theme.colors.text }]}>
            {order.restaurant?.name || "Restaurant"}
          </Text>

          <Text style={[styles.orderInfo, { color: theme.colors.darkGray }]}>
            {itemCount} {itemCount === 1 ? "item" : "items"} • $
            {order.total.toFixed(2)}
          </Text>

          <Text style={[styles.orderDate, { color: theme.colors.darkGray }]}>
            {formattedDate}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionsContainer}>
        {/* Track Order button - only show for orders in progress */}
        {order.orderStatus >= ORDER_STATUS.CONFIRMED &&
          order.orderStatus < ORDER_STATUS.DELIVERED && (
            <TouchableOpacity
              style={[
                styles.trackButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => onPress("track")}
            >
              <Icon name="map-marker" size={16} color={theme.colors.white} />
              <Text
                style={[styles.trackButtonText, { color: theme.colors.white }]}
              >
                Track Order
              </Text>
            </TouchableOpacity>
          )}

        {/* Reorder button - only show for completed orders */}
        {order.orderStatus === ORDER_STATUS.DELIVERED && (
          <TouchableOpacity
            style={[
              styles.reorderButton,
              { borderColor: theme.colors.primary },
            ]}
            onPress={() => onPress("reorder")}
          >
            <Icon name="refresh" size={16} color={theme.colors.primary} />
            <Text
              style={[
                styles.reorderButtonText,
                { color: theme.colors.primary },
              ]}
            >
              Reorder
            </Text>
          </TouchableOpacity>
        )}

        {/* Rate order button - only show for delivered orders that haven't been rated */}
        {order.orderStatus === ORDER_STATUS.DELIVERED && !order.isRated && (
          <TouchableOpacity
            style={[styles.rateButton, { borderColor: theme.colors.warning }]}
            onPress={() => onPress("rate")}
          >
            <Icon name="star" size={16} color={theme.colors.warning} />
            <Text
              style={[styles.rateButtonText, { color: theme.colors.warning }]}
            >
              Rate
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  orderNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderLabel: {
    fontSize: 14,
    marginRight: 4,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: "500",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  restaurantContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  restaurantLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  restaurantInfo: {
    flex: 1,
    justifyContent: "center",
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  orderInfo: {
    fontSize: 14,
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  trackButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  trackButtonText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  reorderButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  reorderButtonText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  rateButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  rateButtonText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
});

export default OrderHistoryItem;
