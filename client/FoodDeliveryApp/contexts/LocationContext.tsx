// contexts/LocationContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import * as Location from "expo-location";

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface Address {
  id?: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
  isDefault: boolean;
  notes?: string;
}

interface LocationContextType {
  currentLocation: LocationCoordinates | null;
  selectedAddress: Address | null;
  addresses: Address[];
  isLoading: boolean;
  errorMsg: string | null;
  getCurrentLocation: () => Promise<void>;
  selectAddress: (address: Address) => void;
  addAddress: (address: Omit<Address, "id">) => Address;
  updateAddress: (addressId: string, updatedData: Partial<Address>) => void;
  deleteAddress: (addressId: string) => void;
  startWatchingPosition: () => void;
  stopWatchingPosition: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(
  undefined
);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({
  children,
}) => {
  const [currentLocation, setCurrentLocation] =
    useState<LocationCoordinates | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [locationWatcher, setLocationWatcher] =
    useState<Location.LocationSubscription | null>(null);

  // Function to get the current location
  const getCurrentLocation = async (): Promise<void> => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        setIsLoading(false);
        return;
      }

      // Get the location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      setCurrentLocation({
        lat: latitude,
        lng: longitude,
      });

      // Optionally get address information
      try {
        const addressResponse = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (addressResponse && addressResponse.length > 0) {
          const address = addressResponse[0];
          setSelectedAddress({
            title: "Current Location",
            address: `${address.street || ""} ${address.city || ""} ${
              address.region || ""
            }`,
            lat: latitude,
            lng: longitude,
            isDefault: true,
          });
        }
      } catch (error) {
        console.log("Error getting address:", error);
      }
    } catch (error) {
      console.error("Error getting location:", error);
      setErrorMsg("Failed to get your location");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to start watching position
  const startWatchingPosition = async (): Promise<void> => {
    try {
      // Request permission if not already granted
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      // Stop any existing watcher
      if (locationWatcher) {
        stopWatchingPosition();
      }

      // Start watching position
      const watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update if moved by 10 meters
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          setCurrentLocation({
            lat: latitude,
            lng: longitude,
          });
        }
      );

      setLocationWatcher(watcher);
    } catch (error) {
      console.error("Error watching position:", error);
      setErrorMsg("Failed to watch your location");
    }
  };

  // Function to stop watching position
  const stopWatchingPosition = (): void => {
    if (locationWatcher) {
      locationWatcher.remove();
      setLocationWatcher(null);
    }
  };

  const selectAddress = (address: Address): void => {
    setSelectedAddress(address);
  };

  const addAddress = (address: Omit<Address, "id">): Address => {
    const newAddress = { ...address, id: Date.now().toString() };
    setAddresses([...addresses, newAddress]);
    return newAddress;
  };

  const updateAddress = (
    addressId: string,
    updatedData: Partial<Address>
  ): void => {
    const updatedAddresses = addresses.map((addr) =>
      addr.id === addressId ? { ...addr, ...updatedData } : addr
    );
    setAddresses(updatedAddresses);
  };

  const deleteAddress = (addressId: string): void => {
    const filteredAddresses = addresses.filter((addr) => addr.id !== addressId);
    setAddresses(filteredAddresses);

    // If deleted address was selected, revert to current location
    if (selectedAddress && selectedAddress.id === addressId) {
      setSelectedAddress(null);
    }
  };

  // Initial location fetch
  useEffect(() => {
    getCurrentLocation();
    return () => {
      // Clean up location watcher on component unmount
      stopWatchingPosition();
    };
  }, []);

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        selectedAddress,
        addresses,
        isLoading,
        errorMsg,
        getCurrentLocation,
        selectAddress,
        addAddress,
        updateAddress,
        deleteAddress,
        startWatchingPosition,
        stopWatchingPosition,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
};
