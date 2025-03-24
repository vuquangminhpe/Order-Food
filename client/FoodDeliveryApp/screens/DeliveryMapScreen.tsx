import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
  SafeAreaView,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useLocation } from "../contexts/LocationContext";
import { orderService, OrderStatus } from "../api/orderService";
import { userService } from "../api/userService";

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const DeliveryMapScreen = ({ route, navigation }: any) => {
  const { theme } = useTheme();
  const { currentLocation } = useLocation();
  const mapRef = useRef<MapView>(null);

  // State
  const [loading, setLoading] = useState(true);
  const [activeDeliveries, setActiveDeliveries] = useState<any>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [region, setRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const [locationUpdateInterval, setLocationUpdateInterval] =
    useState<any>(null);

  // Fetch active deliveries
  const fetchActiveDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch active deliveries from API
      const activeDeliveriesResponse =
        await orderService.getActiveDeliveryOrders();
      setActiveDeliveries(activeDeliveriesResponse || []);

      // Set initial region to current location
      if (currentLocation) {
        setRegion({
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        });
      }
    } catch (err) {
      console.error("Error fetching active deliveries:", err);
      setError("Failed to load active deliveries. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Initialize
  useEffect(() => {
    fetchActiveDeliveries();

    // Start periodic location updates
    startLocationUpdates();

    return () => {
      // Clean up
      if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval);
      }
    };
  }, []);

  // Start sending location updates to server
  const startLocationUpdates = () => {
    // Clear any existing interval
    if (locationUpdateInterval) {
      clearInterval(locationUpdateInterval);
    }

    // Set up a new interval
    const interval = setInterval(() => {
      updateLocationIfNeeded();
    }, 30000); // Update every 30 seconds

    setLocationUpdateInterval(interval);

    // Immediate update
    updateLocationIfNeeded();
  };

  // Update location on server if we have an active delivery and valid location
  const updateLocationIfNeeded = async () => {
    if (!currentLocation || activeDeliveries.length === 0) return;

    try {
      // Update user location
      await userService.updateLocation(
        currentLocation.lat,
        currentLocation.lng
      );

      // Update delivery location for each active order
      for (const order of activeDeliveries) {
        if (order.orderStatus === OrderStatus.OutForDelivery) {
          await orderService.updateDeliveryLocation(
            order._id,
            currentLocation.lat,
            currentLocation.lng
          );
        }
      }
    } catch (err) {
      console.error("Error updating location:", err);
    }
  };

  // Update region when current location changes
  useEffect(() => {
    if (currentLocation && !selectedOrder) {
      setRegion({
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    }
  }, [currentLocation, selectedOrder]);

  // Create route coordinates for polyline
  useEffect(() => {
    if (selectedOrder && currentLocation) {
      const coordinates = [];

      // If order status is ready for pickup, route is from current location to restaurant
      if (selectedOrder.orderStatus === OrderStatus.ReadyForPickup) {
        coordinates.push({
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
        });

        if (selectedOrder.restaurant?.location) {
          coordinates.push({
            latitude: selectedOrder.restaurant.location.lat,
            longitude: selectedOrder.restaurant.location.lng,
          });
        }
      }
      // If order status is out for delivery, route is from current location to customer
      else if (selectedOrder.orderStatus === OrderStatus.OutForDelivery) {
        coordinates.push({
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
        });

        if (selectedOrder.deliveryAddress) {
          coordinates.push({
            latitude: selectedOrder.deliveryAddress.lat,
            longitude: selectedOrder.deliveryAddress.lng,
          });
        }
      }

      setRouteCoordinates(coordinates as any);

      // Fit map to show all markers
      if (coordinates.length > 1 && mapRef.current) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    }
  }, [selectedOrder, currentLocation]);

  // Handle order press - show route
  const handleOrderPress = (order: any) => {
    setSelectedOrder(order);

    // Center map on appropriate locations
    if (
      order.orderStatus === OrderStatus.ReadyForPickup &&
      order.restaurant?.location
    ) {
      setRegion({
        latitude: order.restaurant.location.lat,
        longitude: order.restaurant.location.lng,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    } else if (
      order.orderStatus === OrderStatus.OutForDelivery &&
      order.deliveryAddress
    ) {
      setRegion({
        latitude: order.deliveryAddress.lat,
        longitude: order.deliveryAddress.lng,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    }
  };

  // Handle order completion
  const handleCompleteDelivery = () => {
    if (!selectedOrder) return;

    Alert.alert(
      "Complete Delivery",
      "Confirm that you have delivered this order to the customer?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          style: "default",
          onPress: async () => {
            try {
              setLoading(true);

              // Call API to update order status
              await orderService.updateOrderStatus(
                selectedOrder._id,
                OrderStatus.Delivered
              );

              // Refresh active deliveries
              await fetchActiveDeliveries();

              // Clear selected order
              setSelectedOrder(null);

              Alert.alert("Success", "Delivery completed successfully");
            } catch (error) {
              console.error("Complete delivery error:", error);
              Alert.alert("Error", "Failed to complete delivery");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle pickup from restaurant
  const handlePickupOrder = () => {
    if (!selectedOrder) return;

    Alert.alert(
      "Pickup Order",
      "Confirm that you have picked up this order from the restaurant?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Pickup",
          style: "default",
          onPress: async () => {
            try {
              setLoading(true);

              // Call API to update order status
              await orderService.updateOrderStatus(
                selectedOrder._id,
                OrderStatus.OutForDelivery
              );

              // Refresh the selected order and active deliveries
              const updatedOrder = await orderService.getOrderById(
                selectedOrder._id
              );
              setSelectedOrder(updatedOrder);
              await fetchActiveDeliveries();

              Alert.alert("Success", "Order picked up successfully");
            } catch (error) {
              console.error("Pickup order error:", error);
              Alert.alert("Error", "Failed to update order status");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Recenter map on current location
  const handleRecenterMap = () => {
    if (!currentLocation) return;

    setRegion({
      latitude: currentLocation.lat,
      longitude: currentLocation.lng,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    });

    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    }
  };

  // Fit all markers on the map
  const fitMapToMarkers = () => {
    if (!mapRef.current || !activeDeliveries.length) return;

    const coordinates = [];

    // Add current location
    if (currentLocation) {
      coordinates.push({
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
      });
    }

    // Add restaurant and customer locations
    activeDeliveries.forEach((delivery: any) => {
      if (delivery.restaurant?.location) {
        coordinates.push({
          latitude: delivery.restaurant.location.lat,
          longitude: delivery.restaurant.location.lng,
        });
      }

      if (delivery.deliveryAddress) {
        coordinates.push({
          latitude: delivery.deliveryAddress.lat,
          longitude: delivery.deliveryAddress.lng,
        });
      }
    });

    if (coordinates.length > 0) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  // Render loading state
  if (loading && !activeDeliveries.length) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading map...
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
        {/* Map */}
        <View style={styles.mapContainer}>
          {region ? (
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={region}
              region={region}
              showsUserLocation
              showsMyLocationButton={false}
              showsCompass
              showsScale
            >
              {/* Restaurant Markers */}
              {activeDeliveries.map(
                (delivery: any) =>
                  delivery.restaurant?.location && (
                    <Marker
                      key={`restaurant-${delivery._id}`}
                      coordinate={{
                        latitude: delivery.restaurant.location.lat,
                        longitude: delivery.restaurant.location.lng,
                      }}
                      title={delivery.restaurant.name || "Restaurant"}
                      description={`Order #${delivery.orderNumber}`}
                      onPress={() => handleOrderPress(delivery)}
                    >
                      <View
                        style={[
                          styles.markerContainer,
                          { backgroundColor: theme.colors.secondary },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="store"
                          size={16}
                          color="#FFF"
                        />
                      </View>
                    </Marker>
                  )
              )}

              {/* Customer Markers */}
              {activeDeliveries.map(
                (delivery: any) =>
                  delivery.deliveryAddress && (
                    <Marker
                      key={`customer-${delivery._id}`}
                      coordinate={{
                        latitude: delivery.deliveryAddress.lat,
                        longitude: delivery.deliveryAddress.lng,
                      }}
                      title={delivery.user?.name || "Customer"}
                      description={delivery.deliveryAddress.address}
                      onPress={() => handleOrderPress(delivery)}
                    >
                      <View
                        style={[
                          styles.markerContainer,
                          { backgroundColor: theme.colors.primary },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="map-marker"
                          size={16}
                          color="#FFF"
                        />
                      </View>
                    </Marker>
                  )
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
          ) : (
            <View
              style={[
                styles.noLocationContainer,
                { backgroundColor: theme.colors.gray },
              ]}
            >
              <MaterialCommunityIcons
                name="map-marker-off"
                size={40}
                color={theme.colors.darkGray}
              />
              <Text
                style={[styles.noLocationText, { color: theme.colors.text }]}
              >
                Unable to get location data
              </Text>
            </View>
          )}

          {/* Map Controls */}
          <View style={styles.mapControls}>
            <TouchableOpacity
              style={[styles.mapButton, { backgroundColor: theme.colors.card }]}
              onPress={handleRecenterMap}
            >
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={22}
                color={theme.colors.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mapButton, { backgroundColor: theme.colors.card }]}
              onPress={fitMapToMarkers}
            >
              <MaterialCommunityIcons
                name="fit-to-page-outline"
                size={22}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Panel */}
        <View
          style={[styles.bottomPanel, { backgroundColor: theme.colors.card }]}
        >
          {selectedOrder ? (
            <View style={styles.orderDetailsPanel}>
              <View style={styles.orderHeader}>
                <View>
                  <Text
                    style={[styles.orderNumber, { color: theme.colors.text }]}
                  >
                    Order #{selectedOrder.orderNumber}
                  </Text>
                  <Text
                    style={[
                      styles.orderStatus,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {selectedOrder.orderStatus === OrderStatus.ReadyForPickup
                      ? "Ready for Pickup"
                      : "Out for Delivery"}
                  </Text>
                </View>
                <Text
                  style={[styles.orderAmount, { color: theme.colors.text }]}
                >
                  ${selectedOrder.total?.toFixed(2) || "0.00"}
                </Text>
              </View>

              <View style={styles.locationDetails}>
                {selectedOrder.orderStatus === OrderStatus.ReadyForPickup ? (
                  // Show restaurant details for pickup
                  <View style={styles.locationItem}>
                    <MaterialCommunityIcons
                      name="store"
                      size={20}
                      color={theme.colors.secondary}
                    />
                    <View style={styles.locationTextContainer}>
                      <Text
                        style={[
                          styles.locationLabel,
                          { color: theme.colors.darkGray },
                        ]}
                      >
                        Pickup from:
                      </Text>
                      <Text
                        style={[
                          styles.locationText,
                          { color: theme.colors.text },
                        ]}
                      >
                        {selectedOrder.restaurant?.name || "Restaurant"}
                      </Text>
                    </View>
                  </View>
                ) : (
                  // Show customer details for delivery
                  <View style={styles.locationItem}>
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={20}
                      color={theme.colors.primary}
                    />
                    <View style={styles.locationTextContainer}>
                      <Text
                        style={[
                          styles.locationLabel,
                          { color: theme.colors.darkGray },
                        ]}
                      >
                        Deliver to:
                      </Text>
                      <Text
                        style={[
                          styles.locationText,
                          { color: theme.colors.text },
                        ]}
                      >
                        {selectedOrder.user?.name || "Customer"}
                      </Text>
                      <Text
                        style={[
                          styles.addressText,
                          { color: theme.colors.darkGray },
                        ]}
                      >
                        {selectedOrder.deliveryAddress?.address || "Address"}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { borderColor: theme.colors.primary },
                  ]}
                  onPress={() =>
                    navigation.navigate("DeliveryOrderDetails", {
                      orderId: selectedOrder._id,
                      order: selectedOrder,
                    })
                  }
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    View Details
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={
                    selectedOrder.orderStatus === OrderStatus.ReadyForPickup
                      ? handlePickupOrder
                      : handleCompleteDelivery
                  }
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      { color: theme.colors.white },
                    ]}
                  >
                    {selectedOrder.orderStatus === OrderStatus.ReadyForPickup
                      ? "Confirm Pickup"
                      : "Complete Delivery"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.orderListPanel}>
              <Text style={[styles.panelTitle, { color: theme.colors.text }]}>
                Active Deliveries
              </Text>

              {activeDeliveries.length > 0 ? (
                <View style={styles.orderList}>
                  {activeDeliveries.map((delivery: any) => (
                    <TouchableOpacity
                      key={delivery._id}
                      style={[
                        styles.orderItem,
                        { borderBottomColor: theme.colors.border },
                      ]}
                      onPress={() => handleOrderPress(delivery)}
                    >
                      <View style={styles.orderItemLeft}>
                        <Text
                          style={[
                            styles.orderItemNumber,
                            { color: theme.colors.text },
                          ]}
                        >
                          #{delivery.orderNumber}
                        </Text>
                        <Text
                          style={[
                            styles.orderItemInfo,
                            { color: theme.colors.darkGray },
                          ]}
                        >
                          {delivery.orderStatus === OrderStatus.ReadyForPickup
                            ? `Pickup: ${
                                delivery.restaurant?.name || "Restaurant"
                              }`
                            : `Deliver to: ${
                                delivery.user?.name || "Customer"
                              }`}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.orderItemStatus,
                          {
                            backgroundColor:
                              delivery.orderStatus ===
                              OrderStatus.ReadyForPickup
                                ? theme.colors.secondary + "20"
                                : theme.colors.primary + "20",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.orderItemStatusText,
                            {
                              color:
                                delivery.orderStatus ===
                                OrderStatus.ReadyForPickup
                                  ? theme.colors.secondary
                                  : theme.colors.primary,
                            },
                          ]}
                        >
                          {delivery.orderStatus === OrderStatus.ReadyForPickup
                            ? "Pickup"
                            : "Deliver"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyOrdersContainer}>
                  <MaterialCommunityIcons
                    name="moped"
                    size={40}
                    color={theme.colors.placeholder}
                  />
                  <Text
                    style={[
                      styles.emptyOrdersText,
                      { color: theme.colors.darkGray },
                    ]}
                  >
                    No active deliveries
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

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
              onPress={fetchActiveDeliveries}
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
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  noLocationContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  noLocationText: {
    marginTop: 16,
    fontSize: 16,
  },
  mapControls: {
    position: "absolute",
    right: 16,
    top: 16,
    zIndex: 10,
  },
  mapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
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
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  orderList: {
    marginTop: 8,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  orderItemLeft: {
    flex: 1,
  },
  orderItemNumber: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  orderItemInfo: {
    fontSize: 14,
  },
  orderItemStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  orderItemStatusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyOrdersContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyOrdersText: {
    marginTop: 8,
    fontSize: 16,
  },
  orderListPanel: {
    padding: 8,
  },
  orderDetailsPanel: {
    padding: 8,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: "bold",
  },
  orderStatus: {
    fontSize: 14,
    marginTop: 4,
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  locationDetails: {
    marginBottom: 16,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 8,
  },
  locationTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  addressText: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "transparent",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  errorContainer: {
    position: "absolute",
    bottom: 80,
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

export default DeliveryMapScreen;
