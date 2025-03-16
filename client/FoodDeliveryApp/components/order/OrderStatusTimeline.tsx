import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import moment from "moment";

// Import order status constants
import { OrderStatus } from "../../api/orderService";

const OrderStatusTimeline = ({
  currentStatus,
  confirmedAt,
  preparingAt,
  readyAt,
  deliveredAt,
}: any) => {
  const { theme } = useTheme();

  // Define the timeline steps
  const timelineSteps = [
    {
      status: OrderStatus.Confirmed,
      label: "Order Confirmed",
      icon: "check-circle",
      time: confirmedAt,
    },
    {
      status: OrderStatus.Preparing,
      label: "Preparing",
      icon: "food",
      time: preparingAt,
    },
    {
      status: OrderStatus.ReadyForPickup,
      label: "Ready for Pickup",
      icon: "package-variant-closed",
      time: readyAt,
    },
    {
      status: OrderStatus.Delivered,
      label: "Delivered",
      icon: "check-circle",
      time: deliveredAt,
    },
  ];

  // Format timestamp
  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    return moment(timestamp).format("h:mm A");
  };

  // Determine step status: completed, current, or upcoming
  const getStepStatus = (stepStatus: any) => {
    if (
      currentStatus === OrderStatus.Cancelled ||
      currentStatus === OrderStatus.Rejected
    ) {
      return "cancelled";
    }
    if (stepStatus < currentStatus) {
      return "completed";
    }
    if (stepStatus === currentStatus) {
      return "current";
    }
    return "upcoming";
  };

  // Get color based on step status
  const getColor = (status: any) => {
    switch (status) {
      case "completed":
        return theme.colors.success;
      case "current":
        return theme.colors.primary;
      case "cancelled":
        return theme.colors.error;
      default:
        return theme.colors.gray;
    }
  };

  return (
    <View style={[styles.container, { borderColor: theme.colors.border }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Order Status
      </Text>

      <View style={styles.timeline}>
        {timelineSteps.map((step, index) => {
          const stepStatus = getStepStatus(step.status);
          const color = getColor(stepStatus);
          const isLastStep = index === timelineSteps.length - 1;

          return (
            <View key={step.status} style={styles.timelineItem}>
              {/* Step indicator with icon */}
              <View style={styles.stepIndicator}>
                <View
                  style={[
                    styles.indicator,
                    {
                      borderColor: color,
                      backgroundColor:
                        stepStatus === "completed" || stepStatus === "current"
                          ? color
                          : theme.colors.background,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={step.icon}
                    size={16}
                    color={
                      stepStatus === "completed" || stepStatus === "current"
                        ? theme.colors.white
                        : color
                    }
                  />
                </View>

                {/* Connecting line */}
                {!isLastStep && (
                  <View
                    style={[
                      styles.line,
                      {
                        backgroundColor:
                          stepStatus === "completed"
                            ? theme.colors.success
                            : theme.colors.gray,
                      },
                    ]}
                  />
                )}
              </View>

              {/* Step details */}
              <View style={styles.stepDetails}>
                <View style={styles.labelContainer}>
                  <Text
                    style={[
                      styles.stepLabel,
                      {
                        color:
                          stepStatus === "upcoming"
                            ? theme.colors.darkGray
                            : theme.colors.text,
                      },
                      stepStatus === "current" && styles.currentLabel,
                    ]}
                  >
                    {step.label}
                  </Text>
                  {stepStatus === "current" && (
                    <View
                      style={[
                        styles.activeBadge,
                        { backgroundColor: theme.colors.highlight },
                      ]}
                    >
                      <Text
                        style={[
                          styles.activeBadgeText,
                          { color: theme.colors.primary },
                        ]}
                      >
                        Active
                      </Text>
                    </View>
                  )}
                </View>

                {step.time && (
                  <Text
                    style={[styles.timeText, { color: theme.colors.darkGray }]}
                  >
                    {formatTime(step.time)}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Show cancelled status if applicable */}
      {(currentStatus === OrderStatus.Cancelled ||
        currentStatus === OrderStatus.Rejected) && (
        <View
          style={[
            styles.cancelledContainer,
            { backgroundColor: `${theme.colors.error}15` },
          ]}
        >
          <MaterialCommunityIcons
            name="close-circle"
            size={20}
            color={theme.colors.error}
          />
          <Text style={[styles.cancelledText, { color: theme.colors.error }]}>
            {currentStatus === OrderStatus.Cancelled
              ? "Order Cancelled"
              : "Order Rejected"}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 20,
  },
  stepIndicator: {
    alignItems: "center",
    marginRight: 12,
  },
  indicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
    marginBottom: -12,
  },
  stepDetails: {
    flex: 1,
    paddingTop: 4,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 8,
  },
  currentLabel: {
    fontWeight: "bold",
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  timeText: {
    fontSize: 12,
  },
  cancelledContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  cancelledText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
});

export default OrderStatusTimeline;
