import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "../contexts/LocationContext";
import { userService } from "../api/userService";
import EmptyState from "../components/cart/EmptyState";
import AddressCard from "@/components/user/AddressCard";

const AddressListScreen = ({ route, navigation }: any) => {
  const { selectMode } = route.params || {};
  const { theme } = useTheme();
  const { user } = useAuth();
  const { selectAddress } = useLocation();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Fetch user's addresses
  const fetchAddresses = async () => {
    try {
      setError("");
      const response = await userService.getAddresses();
      setAddresses(response || []);
    } catch (err) {
      console.error("Error fetching addresses:", err);
      setError("Failed to load addresses. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAddresses();
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAddresses();
  };

  // Handle address selection (for checkout flow)
  const handleSelectAddress = (address: any) => {
    if (selectMode) {
      selectAddress(address);
      navigation.goBack();
    }
  };

  // Handle edit address
  const handleEditAddress = (address: any, index: any) => {
    navigation.navigate("EditAddress", { address, index });
  };

  // Handle delete address
  const handleDeleteAddress = (index: any) => {
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
              // Update addresses list
              setAddresses((prevAddresses) =>
                prevAddresses.filter((_, i) => i !== index)
              );
              Alert.alert("Success", "Address deleted successfully");
            } catch (error) {
              console.error("Delete address error:", error);
              Alert.alert("Error", "Failed to delete address");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle set as default
  const handleSetDefault = async (index: any) => {
    try {
      setLoading(true);
      await userService.updateAddress(index, { isDefault: true });

      // Update addresses list to reflect new default
      const updatedAddresses = addresses.map((addr: any, i: number) => {
        return {
          ...addr,
          isDefault: i === index,
        };
      });

      setAddresses(updatedAddresses as any);
    } catch (error) {
      console.error("Set default address error:", error);
      Alert.alert("Error", "Failed to set address as default");
    } finally {
      setLoading(false);
    }
  };

  // Render address item
  const renderAddressItem = ({ item, index }: any) => (
    <AddressCard
      address={item}
      onPress={() => handleSelectAddress(item)}
      onEdit={() => handleEditAddress(item, index)}
      onDelete={() => handleDeleteAddress(index)}
      onSetDefault={() => handleSetDefault(index)}
      selected={selectMode}
      showActions={!selectMode}
    />
  );

  // Render empty state
  const renderEmptyState = () => (
    <EmptyState
      icon="map-marker-off"
      title="No Addresses Found"
      description="You haven't added any delivery addresses yet."
      buttonText="Add New Address"
      onButtonPress={() => navigation.navigate("AddAddress")}
    />
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>
              Loading addresses...
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              data={addresses}
              renderItem={renderAddressItem}
              keyExtractor={(item, index) => `address-${index}`}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={renderEmptyState}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              showsVerticalScrollIndicator={false}
            />

            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => navigation.navigate("AddAddress")}
            >
              <Icon name="plus" size={24} color={theme.colors.white} />
              <Text
                style={[styles.addButtonText, { color: theme.colors.white }]}
              >
                Add New Address
              </Text>
            </TouchableOpacity>

            {error && (
              <View
                style={[
                  styles.errorContainer,
                  { backgroundColor: "rgba(255,0,0,0.1)" },
                ]}
              >
                <Icon
                  name="alert-circle"
                  size={20}
                  color={theme.colors.error}
                />
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {error}
                </Text>
              </View>
            )}
          </>
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
  listContent: {
    padding: 16,
    paddingBottom: 90, // Space for the add button
  },
  addButton: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
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
});

export default AddressListScreen;
