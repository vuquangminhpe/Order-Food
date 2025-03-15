import React, { createContext, useState, useEffect, useContext } from "react";
import Geolocation from "react-native-geolocation-service";
import { Platform, PermissionsAndroid, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";

export const LocationContext = createContext({
  currentLocation: null,
  selectedAddress: null,
  locationPermission: false,
  loading: true,
  error: null as string | null,
  getCurrentLocation: async () => {},
  requestLocationPermission: async () => {},
  startWatchingPosition: async () => {},
  stopWatchingPosition: () => {},
  selectAddress: (address: any) => {},
});

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }: any) => {
  const { user, hasRole, USER_ROLES } = useAuth();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Request permission to use location
  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === "ios") {
        const granted = await Geolocation.requestAuthorization("whenInUse");
        setLocationPermission(granted === "granted");
        return granted === "granted";
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "This app needs access to your location",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        setLocationPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err: any) {
      setError(err);
      console.error("Error requesting location permission:", err);
      return false;
    }
  };

  // Get the current location
  const getCurrentLocation = async (forceRefresh = false): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (!locationPermission) {
        const granted = await requestLocationPermission();
        if (!granted) {
          setError("Location permission not granted");
          setLoading(false);
          null;
        }
      }

      // Get current position
      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const locationData = {
              lat: latitude,
              lng: longitude,
              timestamp: new Date().toISOString(),
            };
            setCurrentLocation(locationData as any);
            setLoading(false);
            resolve(locationData as any);
          },
          (err: any) => {
            setError(err.message);
            setLoading(false);
            reject(err);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: forceRefresh ? 0 : 10000,
          }
        );
      });
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      null;
    }
  };

  // Start watching position (for delivery personnel)
  const startWatchingPosition = async () => {
    try {
      if (!locationPermission) {
        const granted = await requestLocationPermission();
        if (!granted) {
          setError("Location permission not granted");
          return false;
        }
      }

      // Clear any existing watchers
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }

      // Start watching position
      const id = Geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationData = {
            lat: latitude,
            lng: longitude,
            timestamp: new Date().toISOString(),
          };
          setCurrentLocation(locationData as any);

          // For delivery personnel, update location on the server
          if (user && hasRole(USER_ROLES.DELIVERY_PERSON)) {
            updateDeliveryPersonLocation(locationData);
          }
        },
        (err) => {
          setError(err.message);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 10, // minimum distance in meters
          interval: 5000, // minimum time interval in ms
          fastestInterval: 2000, // fastest interval in ms
        }
      );

      setWatchId(id as any);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // Stop watching position
  const stopWatchingPosition = () => {
    if (watchId !== null) {
      Geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  // Update delivery person location on the server
  const updateDeliveryPersonLocation = async (location: any) => {
    try {
      if (!user || !hasRole(USER_ROLES.DELIVERY_PERSON)) {
        return;
      }

      await userService.updateLocation(location.lat, location.lng);
    } catch (err) {
      console.error("Error updating delivery person location:", err);
    }
  };

  // Load selected address from storage
  useEffect(() => {
    const loadSelectedAddress = async () => {
      try {
        const storedAddress = await AsyncStorage.getItem("selectedAddress");
        if (storedAddress) {
          setSelectedAddress(JSON.parse(storedAddress));
        }
      } catch (err) {
        console.error("Error loading selected address:", err);
      }
    };

    loadSelectedAddress();
  }, []);

  // Save selected address to storage when it changes
  useEffect(() => {
    const saveSelectedAddress = async () => {
      try {
        if (selectedAddress) {
          await AsyncStorage.setItem(
            "selectedAddress",
            JSON.stringify(selectedAddress)
          );
        }
      } catch (err) {
        console.error("Error saving selected address:", err);
      }
    };

    saveSelectedAddress();
  }, [selectedAddress]);

  // Start watching position for delivery personnel
  useEffect(() => {
    if (user && hasRole(USER_ROLES.DELIVERY_PERSON)) {
      startWatchingPosition();
    }

    return () => {
      stopWatchingPosition();
    };
  }, [user]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Set selected address
  const selectAddress = (address: any) => {
    setSelectedAddress(address);
  };

  const value = {
    currentLocation,
    selectedAddress,
    locationPermission,
    loading,
    error,
    getCurrentLocation,
    requestLocationPermission,
    startWatchingPosition,
    stopWatchingPosition,
    selectAddress,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
