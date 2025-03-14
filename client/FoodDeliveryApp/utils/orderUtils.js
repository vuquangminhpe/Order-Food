import { OrderStatus } from "../api/orderService";

/**
 * Get human-readable status name from OrderStatus code
 * @param {number} status - OrderStatus enum value
 * @returns {string} Human-readable status name
 */
export const getStatusName = (status) => {
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

/**
 * Get icon name for order status
 * @param {number} status - OrderStatus enum value
 * @returns {string} Icon name for MaterialCommunityIcons
 */
export const getStatusIcon = (status) => {
  switch (status) {
    case OrderStatus.Pending:
      return "clock-outline";
    case OrderStatus.Confirmed:
      return "check-circle-outline";
    case OrderStatus.Preparing:
      return "food-variant";
    case OrderStatus.ReadyForPickup:
      return "package-variant-closed";
    case OrderStatus.OutForDelivery:
      return "truck-delivery";
    case OrderStatus.Delivered:
      return "check-circle";
    case OrderStatus.Cancelled:
      return "close-circle";
    case OrderStatus.Rejected:
      return "close-circle-outline";
    default:
      return "help-circle-outline";
  }
};

/**
 * Get color for order status (to be used with theme)
 * @param {number} status - OrderStatus enum value
 * @returns {string} Color key from theme.colors
 */
export const getStatusColor = (status) => {
  switch (status) {
    case OrderStatus.Pending:
      return "warning";
    case OrderStatus.Confirmed:
      return "info";
    case OrderStatus.Preparing:
      return "secondary";
    case OrderStatus.ReadyForPickup:
      return "accent";
    case OrderStatus.OutForDelivery:
      return "primary";
    case OrderStatus.Delivered:
      return "success";
    case OrderStatus.Cancelled:
      return "error";
    case OrderStatus.Rejected:
      return "error";
    default:
      return "darkGray";
  }
};

/**
 * Get next possible status transitions for an order
 * @param {number} currentStatus - Current OrderStatus enum value
 * @returns {Array} Array of possible next statuses
 */
export const getNextPossibleStatuses = (currentStatus) => {
  switch (currentStatus) {
    case OrderStatus.Pending:
      return [OrderStatus.Confirmed, OrderStatus.Rejected];
    case OrderStatus.Confirmed:
      return [OrderStatus.Preparing, OrderStatus.Cancelled];
    case OrderStatus.Preparing:
      return [OrderStatus.ReadyForPickup];
    case OrderStatus.ReadyForPickup:
      return [OrderStatus.OutForDelivery];
    case OrderStatus.OutForDelivery:
      return [OrderStatus.Delivered];
    default:
      return [];
  }
};

/**
 * Check if an order can be cancelled
 * @param {number} status - OrderStatus enum value
 * @returns {boolean} True if order can be cancelled
 */
export const canCancelOrder = (status) => {
  return [OrderStatus.Pending, OrderStatus.Confirmed].includes(status);
};

/**
 * Format order date with appropriate format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
export const formatOrderDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format relative time (e.g. "2 hours ago")
 * @param {string} dateString - ISO date string
 * @returns {string} Relative time string
 */
export const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
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
