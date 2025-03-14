import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Platform,
  Linking,
  Alert,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../contexts/ThemeContext";
import { useSocket } from "../contexts/SocketContext";
import { orderService, OrderStatus } from "../api/orderService";
import OrderStatusTimeline from "../components/order/OrderStatusTimeline";
import DeliveryPersonInfo from "../components/order/DeliveryPersonInfo";

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const OrderTrackingScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const { theme } = useTheme();
  const { socket, connected, deliveryUpdates } = useSocket();

  // Refs
  const mapRef = useRef(null);

  // State
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [region, setRegion] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const orderData = await orderService.getOrderById(orderId);
        setOrder(orderData);

        // Set initial region to restaurant location or delivery address
        if (orderData.restaurant && orderData.restaurant.location) {
          setRegion({
            latitude: orderData.restaurant.location.lat,
            longitude: orderData.restaurant.location.lng,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          });
        } else if (orderData.deliveryAddress) {
          setRegion({
            latitude: orderData.deliveryAddress.lat,
            longitude: orderData.deliveryAddress.lng,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          });
        }

        // Fetch tracking information if order is out for delivery
        if (
          orderData.orderStatus === OrderStatus.OutForDelivery ||
          orderData.orderStatus === OrderStatus.ReadyForPickup
        ) {
          try {
            const trackingData = await orderService.getOrderTracking(orderId);
            setTracking(trackingData);

            // Update region to current delivery location if available
            if (trackingData.currentLocation) {
              setRegion({
                latitude: trackingData.currentLocation.lat,
                longitude: trackingData.currentLocation.lng,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
              });

              // Create route coordinates
              createRouteCoordinates(trackingData, orderData);
            }
          } catch (trackErr) {
            console.error("Error fetching tracking info:", trackErr);
            // Not setting error as this is not critical
          }
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError("Failed to load order details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();

    // Set up polling for periodic updates (as a fallback for sockets)
    const intervalId = setInterval(fetchOrderDetails, 30000); // Every 30 seconds

    return () => clearInterval(intervalId);
  }, [orderId]);

  // Listen for delivery updates via socket
  useEffect(() => {
    const locationUpdate = deliveryUpdates.find(
      (update) => update.type === "location" && update.orderId === orderId
    );

    if (locationUpdate && order) {
      // Update tracking with new location
      const updatedLocation = {
        lat: locationUpdate.location.lat,
        lng: locationUpdate.location.lng,
        timestamp: locationUpdate.timestamp,
      };

      setTracking((prev) => ({
        ...prev,
        currentLocation: updatedLocation,
        locationHistory: prev?.locationHistory
          ? [...prev.locationHistory, updatedLocation]
          : [updatedLocation],
      }));

      // Update region
      setRegion({
        latitude: locationUpdate.location.lat,
        longitude: locationUpdate.location.lng,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });

      // Update route
      if (tracking) {
        createRouteCoordinates(
          { ...tracking, currentLocation: updatedLocation },
          order
        );
      }
    }
  }, [deliveryUpdates, orderId, order]);

  // Create route coordinates for polyline
  const createRouteCoordinates = (trackingData, orderData) => {
    const coordinates = [];

    // Add restaurant location as starting point
    if (orderData.restaurant && orderData.restaurant.location) {
      coordinates.push({
        latitude: orderData.restaurant.location.lat,
        longitude: orderData.restaurant.location.lng,
      });
    }

    // Add current delivery location
    if (trackingData.currentLocation) {
      coordinates.push({
        latitude: trackingData.currentLocation.lat,
        longitude: trackingData.currentLocation.lng,
      });
    }

    // Add customer address as destination
    if (orderData.deliveryAddress) {
      coordinates.push({
        latitude: orderData.deliveryAddress.lat,
        longitude: orderData.deliveryAddress.lng,
      });
    }

    setRouteCoordinates(coordinates);
  };

  // Fit all markers in map view
  const fitAllMarkers = () => {
    if (mapRef.current && routeCoordinates.length > 0) {
      mapRef.current.fitToCoordinates(routeCoordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  // Handle call delivery person
  const handleCallDeliveryPerson = () => {
    if (!order || !order.deliveryPerson || !order.deliveryPerson.phone) {
      Alert.alert("Error", "Delivery person contact information not available");
      return;
    }

    Linking.openURL(`tel:${order.deliveryPerson.phone}`);
  };

  // Handle cancel order
  const handleCancelOrder = () => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await orderService.cancelOrder(orderId, "Customer canceled");
            Alert.alert("Success", "Your order has been canceled", [
              { text: "OK", onPress: () => navigation.goBack() },
            ]);
          } catch (err) {
            console.error("Error canceling order:", err);
            Alert.alert("Error", "Failed to cancel order. Please try again.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // Get status text based on order status
  const getStatusText = () => {
    if (!order) return "Processing Order";

    switch (order.orderStatus) {
      case OrderStatus.Pending:
        return "Waiting for Restaurant to Accept";
      case OrderStatus.Confirmed:
        return "Order Confirmed";
      case OrderStatus.Preparing:
        return "Restaurant is Preparing Your Order";
      case OrderStatus.ReadyForPickup:
        return "Order Ready for Pickup";
      case OrderStatus.OutForDelivery:
        return "Order Out For Delivery";
      case OrderStatus.Delivered:
        return "Order Delivered";
      case OrderStatus.Cancelled:
        return "Order Cancelled";
      case OrderStatus.Rejected:
        return "Order Rejected";
      default:
        return "Processing Order";
    }
  };

  // Check if order is cancelable
  const isOrderCancelable = () => {
    if (!order) return false;

    return [OrderStatus.Pending, OrderStatus.Confirmed].includes(
      order.orderStatus
    );
  };

  // Check if order is in transit (being delivered)
  const isOrderInTransit = () => {
    if (!order) return false;

    return [OrderStatus.ReadyForPickup, OrderStatus.OutForDelivery].includes(
      order.orderStatus
    );
  };

  // Check if order is completed
  const isOrderCompleted = () => {
    if (!order) return false;

    return [
      OrderStatus.Delivered,
      OrderStatus.Cancelled,
      OrderStatus.Rejected,
    ].includes(order.orderStatus);
  };

  // Render loading state
  if (loading && !order) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading order tracking information...
        </Text>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Icon name="alert-circle" size={60} color={theme.colors.error} />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[
            styles.retryButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.retryButtonText, { color: theme.colors.white }]}>
            Go Back
          </Text>
        </TouchableOpacity>
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
        {/* Status Header */}
        <View
          style={[
            styles.statusHeader,
            {
              backgroundColor: theme.colors.background,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.orderNumberRow}>
            <Text
              style={[
                styles.orderNumberLabel,
                { color: theme.colors.darkGray },
              ]}
            >
              Order #{order?.orderNumber}
            </Text>
            {isOrderCancelable() && (
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { borderColor: theme.colors.error },
                ]}
                onPress={handleCancelOrder}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: theme.colors.error },
                  ]}
                >
                  Cancel Order
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.statusText, { color: theme.colors.text }]}>
            {getStatusText()}
          </Text>

          {isOrderInTransit() && order?.estimatedDeliveryTime && (
            <Text
              style={[styles.estimatedTime, { color: theme.colors.primary }]}
            >
              Estimated Delivery: {order.estimatedDeliveryTime} min
            </Text>
          )}
        </View>

        {/* Map View */}
        {isOrderInTransit() && region && (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={region}
              region={region}
              onMapReady={fitAllMarkers}
            >
              {/* Restaurant Marker */}
              {order?.restaurant?.location && (
                <Marker
                  coordinate={{
                    latitude: order.restaurant.location.lat,
                    longitude: order.restaurant.location.lng,
                  }}
                  title={order.restaurant.name}
                  description="Restaurant"
                >
                  <View style={styles.restaurantMarker}>
                    <Icon name="store" size={20} color="#FFF" />
                  </View>
                </Marker>
              )}

              {/* Delivery Person Marker */}
              {tracking?.currentLocation && (
                <Marker
                  coordinate={{
                    latitude: tracking.currentLocation.lat,
                    longitude: tracking.currentLocation.lng,
                  }}
                  title="Delivery Person"
                  description="Your order is on the way"
                >
                  <View style={styles.deliveryMarker}>
                    <Icon name="bike" size={20} color="#FFF" />
                  </View>
                </Marker>
              )}

              {/* Destination Marker */}
              {order?.deliveryAddress && (
                <Marker
                  coordinate={{
                    latitude: order.deliveryAddress.lat,
                    longitude: order.deliveryAddress.lng,
                  }}
                  title="Delivery Address"
                  description={order.deliveryAddress.address}
                >
                  <View style={styles.destinationMarker}>
                    <Icon name="home" size={20} color="#FFF" />
                  </View>
                </Marker>
              )}

              {/* Route Polyline */}
              {routeCoordinates.length > 1 && (
                <Polyline
                  coordinates={routeCoordinates}
                  strokeWidth={4}
                  strokeColor={theme.colors.primary}
                />
              )}
            </MapView>

            {/* Map Controls */}
            <TouchableOpacity
              style={[
                styles.recenterButton,
                { backgroundColor: theme.colors.background },
              ]}
              onPress={fitAllMarkers}
            >
              <Icon
                name="crosshairs-gps"
                size={24}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Delivery Person Info */}
        {isOrderInTransit() && order?.deliveryPerson && (
          <DeliveryPersonInfo
            deliveryPerson={order.deliveryPerson}
            onCall={handleCallDeliveryPerson}
          />
        )}

        {/* Order Status Timeline */}
        <OrderStatusTimeline
          currentStatus={order?.orderStatus}
          confirmedAt={order?.confirmedAt}
          preparingAt={order?.preparingAt}
          readyAt={order?.readyAt}
          deliveredAt={order?.deliveredAt}
        />

        {/* Restaurant Info */}
        <View
          style={[
            styles.restaurantContainer,
            { borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Restaurant
          </Text>
          <View style={styles.restaurantInfo}>
            <Icon name="store" size={20} color={theme.colors.darkGray} />
            <Text style={[styles.restaurantName, { color: theme.colors.text }]}>
              {order?.restaurant?.name || "Restaurant"}
            </Text>
          </View>
          <TouchableOpacity style={styles.viewOrderButton}>
            <Text
              style={[styles.viewOrderText, { color: theme.colors.primary }]}
            >
              View Order Details
            </Text>
            <Icon name="chevron-right" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Delivery Address */}
        <View
          style={[
            styles.addressContainer,
            { borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Delivery Address
          </Text>
          <View style={styles.addressInfo}>
            <Icon name="map-marker" size={20} color={theme.colors.darkGray} />
            <Text style={[styles.addressText, { color: theme.colors.text }]}>
              {order?.deliveryAddress?.address || "Address not available"}
            </Text>
          </View>
        </View>

        {/* Socket Connection Status */}
        <View
          style={[
            styles.socketStatus,
            {
              backgroundColor: connected
                ? theme.colors.success
                : theme.colors.error,
              opacity: 0.8,
            },
          ]}
        >
          <Text
            style={[styles.socketStatusText, { color: theme.colors.white }]}
          >
            {connected
              ? "Live Updates Active"
              : "Offline Mode - Updates Paused"}
          </Text>
        </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  statusHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  orderNumberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderNumberLabel: {
    fontSize: 14,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  statusText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  estimatedTime: {
    fontSize: 14,
    fontWeight: "500",
  },
  mapContainer: {
    height: 300,
    width: "100%",
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  recenterButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  restaurantMarker: {
    backgroundColor: "#4CAF50",
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  deliveryMarker: {
    backgroundColor: "#2196F3",
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  destinationMarker: {
    backgroundColor: "#FF5722",
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  restaurantContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  restaurantInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 14,
    marginLeft: 8,
  },
  viewOrderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  viewOrderText: {
    fontSize: 14,
    fontWeight: "500",
  },
  addressContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  addressInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  addressText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  socketStatus: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    alignItems: "center",
  },
  socketStatusText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default OrderTrackingScreen;
