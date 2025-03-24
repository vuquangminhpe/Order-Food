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
import { useAuth } from "../contexts/AuthContext";

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const DeliveryMapScreen = ({ route, navigation }: any) => {
  const { theme } = useTheme();
  const { currentLocation } = useLocation();
  const { user } = useAuth();
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
  const [usingMockData, setUsingMockData] = useState(false);

  // ============= MOCK DATA GENERATION FUNCTIONS =============
  // Central location for mock data (e.g., Ho Chi Minh City)
  const centralLocation = {
    lat: 10.7758439,
    lng: 106.7017555,
  };

  // Helper to generate a location near the central point
  const getNearbyLocation = (maxDistanceKm = 5) => {
    // 0.01 in lat/lng is roughly 1km
    const latOffset =
      (Math.random() * maxDistanceKm * 2 - maxDistanceKm) * 0.01;
    const lngOffset =
      (Math.random() * maxDistanceKm * 2 - maxDistanceKm) * 0.01;

    return {
      lat: centralLocation.lat + latOffset,
      lng: centralLocation.lng + lngOffset,
    };
  };

  // Mock restaurants
  const mockRestaurants = [
    {
      _id: "rest001",
      name: "Phở Hà Nội",
      address: "123 Nguyễn Huệ, District 1",
      location: getNearbyLocation(3),
    },
    {
      _id: "rest002",
      name: "Bánh Mì Express",
      address: "45 Lê Lợi, District 1",
      location: getNearbyLocation(2),
    },
    {
      _id: "rest003",
      name: "Cơm Tấm Sài Gòn",
      address: "78 Võ Văn Tần, District 3",
      location: getNearbyLocation(4),
    },
    {
      _id: "rest004",
      name: "Bún Chả 36",
      address: "112 Hai Bà Trưng, District 1",
      location: getNearbyLocation(3.5),
    },
    {
      _id: "rest005",
      name: "Highlands Coffee",
      address: "333 Nguyễn Trãi, District 5",
      location: getNearbyLocation(5),
    },
  ];

  // Mock food items
  const mockFoodItems = [
    { name: "Phở Bò", price: 55000 },
    { name: "Bánh Mì Thịt", price: 25000 },
    { name: "Cơm Tấm Sườn", price: 45000 },
    { name: "Bún Chả", price: 60000 },
    { name: "Cà Phê Sữa Đá", price: 35000 },
    { name: "Trà Sữa Trân Châu", price: 40000 },
    { name: "Gỏi Cuốn", price: 35000 },
    { name: "Chả Giò", price: 30000 },
    { name: "Bún Bò Huế", price: 65000 },
    { name: "Bún Thịt Nướng", price: 50000 },
  ];

  // Mock customer addresses
  const mockAddresses = [
    { address: "12 Lý Tự Trọng, District 1", location: getNearbyLocation() },
    { address: "56 Trần Hưng Đạo, District 1", location: getNearbyLocation() },
    { address: "789 Điện Biên Phủ, District 3", location: getNearbyLocation() },
    { address: "45 Võ Thị Sáu, District 3", location: getNearbyLocation() },
    { address: "67 Lê Thánh Tôn, District 1", location: getNearbyLocation() },
    {
      address: "890 Nam Kỳ Khởi Nghĩa, District 3",
      location: getNearbyLocation(),
    },
  ];

  // Generate a random order number
  const generateOrderNumber = () => {
    return `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  // Generate random items for an order
  const generateOrderItems = (maxItems = 5) => {
    const numItems = Math.floor(Math.random() * maxItems) + 1;
    const items = [];

    for (let i = 0; i < numItems; i++) {
      const randomItem =
        mockFoodItems[Math.floor(Math.random() * mockFoodItems.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;

      items.push({
        ...randomItem,
        quantity,
        totalPrice: randomItem.price * quantity,
      });
    }

    return items;
  };

  // Calculate total from items
  const calculateTotal = (items) => {
    return items.reduce((total, item) => total + (item.totalPrice || 0), 0);
  };

  // Generate a single mock order
  const generateMockOrder = (
    status = OrderStatus.ReadyForPickup,
    hasDeliveryPerson = false
  ) => {
    const restaurant =
      mockRestaurants[Math.floor(Math.random() * mockRestaurants.length)];
    const deliveryAddress =
      mockAddresses[Math.floor(Math.random() * mockAddresses.length)];
    const items = generateOrderItems();
    const total = calculateTotal(items);

    return {
      _id: `order_${Math.random().toString(36).substr(2, 9)}`,
      orderNumber: generateOrderNumber(),
      orderStatus: status, // Using orderStatus instead of status for consistency with API
      items: items,
      total: total,
      subtotal: total * 0.9,
      deliveryFee: 15000,
      restaurant: restaurant,
      deliveryAddress: deliveryAddress,
      estimatedDeliveryTime: Math.floor(Math.random() * 30) + 15, // 15-45 minutes
      createdAt: new Date(
        Date.now() - Math.floor(Math.random() * 3600000)
      ).toISOString(), // Within the last hour
      deliveryPersonId: hasDeliveryPerson ? user?.id : undefined,
      paymentMethod: Math.random() > 0.5 ? 0 : 1, // Cash or Card
      notes:
        Math.random() > 0.7 ? "Please bring extra napkins and chopsticks" : "",
      user: {
        _id: `user_${Math.random().toString(36).substr(2, 9)}`,
        name: `Khách hàng ${Math.floor(Math.random() * 100)}`,
        phone: `0${Math.floor(Math.random() * 900000000) + 100000000}`,
      },
    };
  };

  // Generate multiple mock orders
  const generateMockOrders = (
    count = 2,
    status = OrderStatus.OutForDelivery,
    hasDeliveryPerson = true
  ) => {
    const orders = [];

    // Create one order that's ready for pickup
    orders.push(generateMockOrder(OrderStatus.ReadyForPickup, true));

    // Create one order that's out for delivery
    orders.push(generateMockOrder(OrderStatus.OutForDelivery, true));

    return orders;
  };

  // Fetch active deliveries with mock data fallback
  const fetchActiveDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);
      setUsingMockData(false);

      // Use the order from route params if available (coming from another screen)
      if (route.params?.order) {
        const orderFromParams = route.params.order;
        setSelectedOrder(orderFromParams);
        setActiveDeliveries([orderFromParams]);
      } else {
        try {
          // Try to fetch active deliveries from API
          const activeDeliveriesResponse =
            await orderService.getActiveDeliveryOrders();

          if (activeDeliveriesResponse && activeDeliveriesResponse.length > 0) {
            setActiveDeliveries(activeDeliveriesResponse);
          } else {
            // If no data from API, use mock data
            console.log("No active deliveries found, using mock data");
            const mockDeliveries = generateMockOrders();
            setActiveDeliveries(mockDeliveries);
            setUsingMockData(true);
          }
        } catch (err) {
          console.error("Error fetching active deliveries:", err);
          // If API call fails, use mock data
          const mockDeliveries = generateMockOrders();
          setActiveDeliveries(mockDeliveries);
          setUsingMockData(true);
        }
      }

      // Set initial region to current location or default location if not available
      if (currentLocation) {
        setRegion({
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        });
      } else if (usingMockData) {
        // If using mock data and no current location, use the central location
        setRegion({
          latitude: centralLocation.lat,
          longitude: centralLocation.lng,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        });
      }
    } catch (err) {
      console.error("Error in fetchActiveDeliveries:", err);
      setError("Failed to load active deliveries. Using demo data.");

      // Fallback to mock data
      const mockDeliveries = generateMockOrders();
      setActiveDeliveries(mockDeliveries);
      setUsingMockData(true);
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
    if (!currentLocation || activeDeliveries.length === 0 || usingMockData)
      return;

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
    if (selectedOrder) {
      const coordinates = [];

      // If order status is ready for pickup, route is from current location to restaurant
      if (selectedOrder.orderStatus === OrderStatus.ReadyForPickup) {
        if (currentLocation) {
          coordinates.push({
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
          });
        } else if (usingMockData) {
          // If using mock data and no current location, use a nearby point
          const mockDriverLocation = getNearbyLocation(1);
          coordinates.push({
            latitude: mockDriverLocation.lat,
            longitude: mockDriverLocation.lng,
          });
        }

        if (selectedOrder.restaurant?.location) {
          coordinates.push({
            latitude: selectedOrder.restaurant.location.lat,
            longitude: selectedOrder.restaurant.location.lng,
          });
        }
      }
      // If order status is out for delivery, route is from current location to customer
      else if (selectedOrder.orderStatus === OrderStatus.OutForDelivery) {
        if (currentLocation) {
          coordinates.push({
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
          });
        } else if (usingMockData) {
          // If using mock data and no current location, use a nearby point
          const mockDriverLocation = getNearbyLocation(1);
          coordinates.push({
            latitude: mockDriverLocation.lat,
            longitude: mockDriverLocation.lng,
          });
        }

        if (selectedOrder.deliveryAddress) {
          coordinates.push({
            latitude: selectedOrder.deliveryAddress.location.lat,
            longitude: selectedOrder.deliveryAddress.location.lng,
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
  }, [selectedOrder, currentLocation, usingMockData]);

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
        latitude: order.deliveryAddress.location.lat,
        longitude: order.deliveryAddress.location.lng,
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

              if (usingMockData) {
                // For mock data, just simulate completion
                setTimeout(() => {
                  // Remove the order from active deliveries
                  setActiveDeliveries(
                    activeDeliveries.filter(
                      (order) => order._id !== selectedOrder._id
                    )
                  );
                  // Clear selected order
                  setSelectedOrder(null);
                  Alert.alert("Success", "Delivery completed successfully");
                  setLoading(false);
                }, 1000);
                return;
              }

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

              if (usingMockData) {
                // For mock data, just simulate pickup
                setTimeout(() => {
                  // Update the order status
                  const updatedOrder = {
                    ...selectedOrder,
                    orderStatus: OrderStatus.OutForDelivery,
                  };

                  // Update in active deliveries
                  const updatedDeliveries = activeDeliveries.map((order) =>
                    order._id === selectedOrder._id ? updatedOrder : order
                  );

                  setActiveDeliveries(updatedDeliveries);
                  setSelectedOrder(updatedOrder);

                  Alert.alert("Success", "Order picked up successfully");
                  setLoading(false);
                }, 1000);
                return;
              }

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
    if (currentLocation) {
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
    } else if (usingMockData) {
      // If using mock data and no current location, center on the mock central location
      setRegion({
        latitude: centralLocation.lat,
        longitude: centralLocation.lng,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: centralLocation.lat,
          longitude: centralLocation.lng,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        });
      }
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
    } else if (usingMockData) {
      // If using mock data and no current location, add the central location
      coordinates.push({
        latitude: centralLocation.lat,
        longitude: centralLocation.lng,
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

      if (delivery.deliveryAddress?.location) {
        coordinates.push({
          latitude: delivery.deliveryAddress.location.lat,
          longitude: delivery.deliveryAddress.location.lng,
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
                  delivery.deliveryAddress?.location && (
                    <Marker
                      key={`customer-${delivery._id}`}
                      coordinate={{
                        latitude: delivery.deliveryAddress.location.lat,
                        longitude: delivery.deliveryAddress.location.lng,
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

          {/* Mock Data Indicator */}
          {usingMockData && (
            <View
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                backgroundColor: "rgba(255, 193, 7, 0.9)",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                zIndex: 999,
              }}
            ></View>
          )}
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
