import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../contexts/ThemeContext";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

const validationSchema = yup.object().shape({
  title: yup.string().required("Address title is required"),
  address: yup
    .string()
    .required("Address is required")
    .min(5, "Address is too short"),
  lat: yup.number().required("Latitude is required").min(-90).max(90),
  lng: yup.number().required("Longitude is required").min(-180).max(180),
  isDefault: yup.boolean(),
});

const AddAddressScreen = async ({ route, navigation }: any) => {
  const { theme } = useTheme();
  const getCurrentLocation = async (
    force = false
  ): Promise<{ lat: number; lng: number }> => {
    // Your existing implementation
    return { lat: 0, lng: 0 }; // Replace with actual lat and lng values
  };
  const mapRef = useRef<MapView>(null);

  const [loading, setLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [mapRegion, setMapRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }>({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [markerCoords, setMarkerCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Fetch current location if not available
  useEffect(() => {
    const fetchLocation = async () => {
      const currentLocation = await getCurrentLocation();
      if (!currentLocation) {
        try {
          const location = await getCurrentLocation();
          if (location === undefined || location === null)
            throw new Error("Location not found");
          initializeMap(location);
        } catch (error) {
          console.error("Error getting location:", error);
          // Set default map region
          initializeMap({
            lat: 21.0278, // Default to Hanoi, Vietnam
            lng: 105.8342,
          });
        }
      } else {
        initializeMap(currentLocation);
      }
    };

    fetchLocation();
  }, []);

  // Initialize map with location
  const initializeMap = (location: { lat: number; lng: number }) => {
    if (!location) return;

    const region = {
      latitude: location.lat,
      longitude: location.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    setMapRegion(region);
    setMarkerCoords({
      latitude: location.lat,
      longitude: location.lng,
    });

    setValue("lat", location.lat);
    setValue("lng", location.lng);

    // Attempt to fetch address from coordinates
    fetchAddressFromCoordinates(location.lat, location.lng);

    setMapLoading(false);
  };

  // Mock function to fetch address from coordinates (geocoding)
  // In a real app, you would use a proper geocoding service like Google's Geocoding API
  const fetchAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      setSearchingLocation(true);

      // Mock a delay to simulate network request
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // This is a mock response - in a real app, you'd make an API call
      const mockAddress = `${Math.round(lat * 1000) / 1000}, ${
        Math.round(lng * 1000) / 1000
      }`;
      setValue("address", mockAddress);
    } catch (error) {
      console.error("Error fetching address:", error);
    } finally {
      setSearchingLocation(false);
    }
  };

  // Handle map drag end
  const onMapDragEnd = (e: {
    nativeEvent: { coordinate: { latitude: any; longitude: any } };
  }) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;

    setMarkerCoords({
      latitude,
      longitude,
    });

    setValue("lat", latitude);
    setValue("lng", longitude);

    // Fetch address for new coordinates
    fetchAddressFromCoordinates(latitude, longitude);
  };

  // Set up form
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      title: "",
      address: "",
      lat: (await getCurrentLocation()).lat,
      lng: (await getCurrentLocation()).lng,
      isDefault: false,
    },
  });

  // Handle form submission
  const onSubmit = async (data: any) => {
    try {
      setLoading(true);

      // Add the address
      await userService.addAddress(data);

      Alert.alert("Success", "Address added successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Add address error:", error);
      Alert.alert("Error", "Failed to add address. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={[
            styles.container,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Map View */}
            <View style={styles.mapContainer}>
              {mapLoading ? (
                <View
                  style={[
                    styles.mapLoading,
                    { backgroundColor: theme.colors.gray },
                  ]}
                >
                  <ActivityIndicator
                    color={theme.colors.primary}
                    size="large"
                  />
                  <Text
                    style={[
                      styles.mapLoadingText,
                      { color: theme.colors.text },
                    ]}
                  >
                    Loading map...
                  </Text>
                </View>
              ) : (
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  provider={PROVIDER_GOOGLE}
                  region={mapRegion}
                  showsUserLocation
                  showsMyLocationButton
                >
                  {markerCoords && (
                    <Marker
                      coordinate={markerCoords}
                      draggable
                      onDragEnd={onMapDragEnd}
                    />
                  )}
                </MapView>
              )}

              <TouchableOpacity
                style={[
                  styles.currentLocationButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={async () => {
                  try {
                    const location = await getCurrentLocation(true);

                    if (location && mapRef.current) {
                      const region = {
                        latitude: location.lat,
                        longitude: location.lng,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      };

                      mapRef.current.animateToRegion(region);

                      setMarkerCoords({
                        latitude: location.lat,
                        longitude: location.lng,
                      });

                      setValue("lat", location.lat);
                      setValue("lng", location.lng);

                      fetchAddressFromCoordinates(location.lat, location.lng);
                    }
                  } catch (error) {
                    console.error("Error getting current location:", error);
                    Alert.alert("Error", "Failed to get current location");
                  }
                }}
              >
                <Icon
                  name="crosshairs-gps"
                  size={24}
                  color={theme.colors.white}
                />
              </TouchableOpacity>

              <View
                style={[
                  styles.mapInstructions,
                  { backgroundColor: theme.colors.card },
                ]}
              >
                <Icon
                  name="gesture-tap-drag"
                  size={20}
                  color={theme.colors.darkGray}
                />
                <Text
                  style={[
                    styles.mapInstructionsText,
                    { color: theme.colors.text },
                  ]}
                >
                  Drag the marker to adjust your location
                </Text>
              </View>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              {/* Title Input */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Address Title
                </Text>
                <Controller
                  control={control}
                  name="title"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.colors.gray,
                          color: theme.colors.text,
                          borderColor: errors.title
                            ? theme.colors.error
                            : theme.colors.gray,
                        },
                      ]}
                      placeholder="E.g., Home, Work, etc."
                      placeholderTextColor={theme.colors.placeholder}
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                {errors.title && (
                  <Text
                    style={[styles.errorText, { color: theme.colors.error }]}
                  >
                    {errors.title.message}
                  </Text>
                )}
              </View>

              {/* Address Input */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Address
                </Text>
                <Controller
                  control={control}
                  name="address"
                  render={({ field: { onChange, value } }) => (
                    <View>
                      <TextInput
                        style={[
                          styles.input,
                          styles.addressInput,
                          {
                            backgroundColor: theme.colors.gray,
                            color: theme.colors.text,
                            borderColor: errors.address
                              ? theme.colors.error
                              : theme.colors.gray,
                          },
                        ]}
                        placeholder="Enter your address"
                        placeholderTextColor={theme.colors.placeholder}
                        value={value}
                        onChangeText={onChange}
                        multiline
                      />
                      {searchingLocation && (
                        <ActivityIndicator
                          style={styles.addressLoader}
                          color={theme.colors.primary}
                          size="small"
                        />
                      )}
                    </View>
                  )}
                />
                {errors.address && (
                  <Text
                    style={[styles.errorText, { color: theme.colors.error }]}
                  >
                    {errors.address.message}
                  </Text>
                )}
              </View>

              {/* Coordinates (Hidden from user, but used in the form) */}
              <Controller name="lat" control={control} render={() => <></>} />
              <Controller name="lng" control={control} render={() => <></>} />

              {/* Default Address Switch */}
              <View style={styles.formGroup}>
                <Controller
                  control={control}
                  name="isDefault"
                  render={({ field: { onChange, value } }) => (
                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={() => onChange(!value)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: theme.colors.primary,
                            backgroundColor: value
                              ? theme.colors.primary
                              : "transparent",
                          },
                        ]}
                      >
                        {value && (
                          <Icon
                            name="check"
                            size={16}
                            color={theme.colors.white}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.checkboxLabel,
                          { color: theme.colors.text },
                        ]}
                      >
                        Set as default address
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: loading
                      ? theme.colors.gray
                      : theme.colors.primary,
                  },
                ]}
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.white} size="small" />
                ) : (
                  <Text
                    style={[
                      styles.submitButtonText,
                      { color: theme.colors.white },
                    ]}
                  >
                    Save Address
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
  mapContainer: {
    height: 250,
    width: "100%",
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  mapLoadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  currentLocationButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapInstructions: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 8,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  mapInstructionsText: {
    marginLeft: 8,
    fontSize: 14,
  },
  formContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
  },
  addressInput: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 12,
    paddingBottom: 12,
  },
  addressLoader: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxLabel: {
    fontSize: 16,
  },
  submitButton: {
    height: 56,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AddAddressScreen;
