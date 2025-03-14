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
import { useLocation } from "../contexts/LocationContext";
import { userService } from "../api/userService";
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

const EditAddressScreen = ({ route, navigation }) => {
  const { address, index } = route.params || {};
  const { theme } = useTheme();
  const { currentLocation, getCurrentLocation } = useLocation();
  const mapRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [mapRegion, setMapRegion] = useState(null);
  const [markerCoords, setMarkerCoords] = useState(null);

  // Set up form with initial address values
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      title: address?.title || "",
      address: address?.address || "",
      lat: address?.lat || 0,
      lng: address?.lng || 0,
      isDefault: address?.isDefault || false,
    },
  });

  // Initialize map with address location
  useEffect(() => {
    const initializeMap = () => {
      if (address && address.lat && address.lng) {
        // Use address coordinates
        setMapRegion({
          latitude: address.lat,
          longitude: address.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setMarkerCoords({
          latitude: address.lat,
          longitude: address.lng,
        });
        setMapLoading(false);
      } else if (currentLocation) {
        // Fall back to current location
        setMapRegion({
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setMarkerCoords({
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
        });
        setValue("lat", currentLocation.lat);
        setValue("lng", currentLocation.lng);
        setMapLoading(false);
      } else {
        // Get current location
        getCurrentLocation()
          .then((location) => {
            if (location) {
              setMapRegion({
                latitude: location.lat,
                longitude: location.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              });
              setMarkerCoords({
                latitude: location.lat,
                longitude: location.lng,
              });
              setValue("lat", location.lat);
              setValue("lng", location.lng);
            } else {
              // Default to some location if can't get current
              const defaultLat = 21.0278; // Default to Hanoi, Vietnam
              const defaultLng = 105.8342;
              setMapRegion({
                latitude: defaultLat,
                longitude: defaultLng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              });
              setMarkerCoords({
                latitude: defaultLat,
                longitude: defaultLng,
              });
              setValue("lat", defaultLat);
              setValue("lng", defaultLng);
            }
            setMapLoading(false);
          })
          .catch((error) => {
            console.error("Error getting location:", error);
            // Set default map region
            const defaultLat = 21.0278; // Default to Hanoi, Vietnam
            const defaultLng = 105.8342;
            setMapRegion({
              latitude: defaultLat,
              longitude: defaultLng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
            setMarkerCoords({
              latitude: defaultLat,
              longitude: defaultLng,
            });
            setValue("lat", defaultLat);
            setValue("lng", defaultLng);
            setMapLoading(false);
          });
      }
    };

    initializeMap();
  }, []);

  // Handle map drag end
  const onMapDragEnd = (e) => {
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

  // Mock function to fetch address from coordinates (geocoding)
  // In a real app, you would use a proper geocoding service like Google's Geocoding API
  const fetchAddressFromCoordinates = async (lat, lng) => {
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

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Update the address
      await userService.updateAddress(index, data);

      Alert.alert("Success", "Address updated successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Update address error:", error);
      Alert.alert("Error", "Failed to update address. Please try again.");
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
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
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
              <Controller name="lat" control={control} render={() => null} />
              <Controller name="lng" control={control} render={() => null} />

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
                    Update Address
                  </Text>
                )}
              </TouchableOpacity>

              {/* Delete Button */}
              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  { backgroundColor: theme.colors.error },
                ]}
                onPress={() => {
                  Alert.alert(
                    "Delete Address",
                    "Are you sure you want to delete this address?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                          try {
                            setLoading(true);
                            await userService.deleteAddress(index);
                            Alert.alert(
                              "Success",
                              "Address deleted successfully",
                              [
                                {
                                  text: "OK",
                                  onPress: () => navigation.goBack(),
                                },
                              ]
                            );
                          } catch (error) {
                            console.error("Delete address error:", error);
                            Alert.alert(
                              "Error",
                              "Failed to delete address. Please try again."
                            );
                          } finally {
                            setLoading(false);
                          }
                        },
                      },
                    ]
                  );
                }}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.deleteButtonText,
                    { color: theme.colors.white },
                  ]}
                >
                  Delete Address
                </Text>
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
  deleteButton: {
    height: 56,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default EditAddressScreen;
