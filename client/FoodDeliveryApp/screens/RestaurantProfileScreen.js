import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { restaurantService } from "../api/restaurantService";

const RestaurantProfileScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  // State
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch restaurant details
  useEffect(() => {
    const fetchRestaurantProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get restaurant ID from user
        const restaurantId = user?.restaurantId || "1"; // Fallback to a default ID for demo

        // Fetch restaurant details
        const restaurantData = await restaurantService.getRestaurantById(
          restaurantId
        );
        setRestaurant(restaurantData);
      } catch (err) {
        console.error("Error fetching restaurant profile:", err);
        setError("Failed to load restaurant profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantProfile();
  }, []);

  // Handle edit profile
  const handleEditProfile = () => {
    navigation.navigate("EditRestaurantProfile", { restaurant });
  };

  // Handle change restaurant image
  const handleChangeImage = (type) => {
    Alert.alert(
      "Change Image",
      "Choose an option to change your image",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: () => console.log("Taking photo") },
        {
          text: "Choose from Gallery",
          onPress: () => console.log("Opening gallery"),
        },
      ],
      { cancelable: true }
    );
  };

  // Handle manage business hours
  const handleManageHours = () => {
    Alert.alert(
      "Business Hours",
      "This would navigate to business hours management screen"
    );
  };

  // Handle manage delivery settings
  const handleDeliverySettings = () => {
    Alert.alert(
      "Delivery Settings",
      "This would navigate to delivery settings screen"
    );
  };

  // Handle manage payment methods
  const handlePaymentMethods = () => {
    Alert.alert(
      "Payment Methods",
      "This would navigate to payment methods screen"
    );
  };

  // Format business hours for display
  const formatBusinessHours = (hours) => {
    if (!hours) return "Not set";

    // This is a simple formatting example
    // In a real app, you would have a more sophisticated formatting logic
    const daysOfWeek = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    return daysOfWeek
      .map((day) => {
        const dayHours = hours[day.toLowerCase()];
        if (!dayHours || !dayHours.isOpen) return `${day}: Closed`;
        return `${day}: ${dayHours.open} - ${dayHours.close}`;
      })
      .join("\n");
  };

  // Render loading state
  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading restaurant profile...
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
          onPress={() => fetchRestaurantProfile()}
        >
          <Text style={[styles.retryButtonText, { color: theme.colors.white }]}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!restaurant) {
    return null;
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Image */}
        <View style={styles.coverImageContainer}>
          <Image
            source={{
              uri:
                restaurant.coverImage || "https://via.placeholder.com/400x200",
            }}
            style={styles.coverImage}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={[
              styles.changeImageButton,
              { backgroundColor: theme.colors.background },
            ]}
            onPress={() => handleChangeImage("cover")}
          >
            <Icon name="camera" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Restaurant Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={{
              uri: restaurant.logo || "https://via.placeholder.com/100",
            }}
            style={[styles.logo, { borderColor: theme.colors.background }]}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={[
              styles.changeLogoButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => handleChangeImage("logo")}
          >
            <Icon name="camera" size={16} color={theme.colors.white} />
          </TouchableOpacity>
        </View>

        {/* Restaurant Information */}
        <View style={styles.infoContainer}>
          <Text style={[styles.restaurantName, { color: theme.colors.text }]}>
            {restaurant.name}
          </Text>

          <View style={styles.categoryRow}>
            {restaurant.categories?.map((category, index) => (
              <View
                key={index}
                style={[
                  styles.categoryTag,
                  { backgroundColor: theme.colors.gray },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: theme.colors.darkGray },
                  ]}
                >
                  {category}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.ratingRow}>
            <Icon name="star" size={16} color={theme.colors.warning} />
            <Text style={[styles.ratingText, { color: theme.colors.text }]}>
              {restaurant.rating?.toFixed(1) || "0.0"}
              <Text style={{ color: theme.colors.darkGray }}>
                ({restaurant.totalRatings || 0} ratings)
              </Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.editProfileButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleEditProfile}
          >
            <Icon name="pencil" size={16} color={theme.colors.white} />
            <Text
              style={[styles.editProfileText, { color: theme.colors.white }]}
            >
              Edit Restaurant Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contact Information */}
        <View
          style={[
            styles.sectionContainer,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Contact Information
          </Text>

          <View style={styles.detailRow}>
            <Icon name="phone" size={20} color={theme.colors.primary} />
            <Text style={[styles.detailText, { color: theme.colors.text }]}>
              {restaurant.phone || "No phone number"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="email" size={20} color={theme.colors.primary} />
            <Text style={[styles.detailText, { color: theme.colors.text }]}>
              {restaurant.email || "No email address"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="map-marker" size={20} color={theme.colors.primary} />
            <Text style={[styles.detailText, { color: theme.colors.text }]}>
              {restaurant.address || "No address"}
            </Text>
          </View>
        </View>

        {/* Business Hours */}
        <View
          style={[
            styles.sectionContainer,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Business Hours
            </Text>
            <TouchableOpacity onPress={handleManageHours}>
              <Text
                style={[styles.actionText, { color: theme.colors.primary }]}
              >
                Manage
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.hoursText, { color: theme.colors.text }]}>
            {formatBusinessHours(restaurant.businessHours)}
          </Text>
        </View>

        {/* Delivery Settings */}
        <View
          style={[
            styles.sectionContainer,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Delivery Settings
            </Text>
            <TouchableOpacity onPress={handleDeliverySettings}>
              <Text
                style={[styles.actionText, { color: theme.colors.primary }]}
              >
                Manage
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailRow}>
            <Icon name="bike-fast" size={20} color={theme.colors.primary} />
            <Text
              style={[styles.detailLabel, { color: theme.colors.darkGray }]}
            >
              Delivery Fee:
            </Text>
            <Text style={[styles.detailText, { color: theme.colors.text }]}>
              ${restaurant.deliveryFee?.toFixed(2) || "0.00"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="timer-sand" size={20} color={theme.colors.primary} />
            <Text
              style={[styles.detailLabel, { color: theme.colors.darkGray }]}
            >
              Estimated Delivery Time:
            </Text>
            <Text style={[styles.detailText, { color: theme.colors.text }]}>
              {restaurant.estimatedDeliveryTime || "30"} min
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="cash-multiple" size={20} color={theme.colors.primary} />
            <Text
              style={[styles.detailLabel, { color: theme.colors.darkGray }]}
            >
              Minimum Order:
            </Text>
            <Text style={[styles.detailText, { color: theme.colors.text }]}>
              ${restaurant.minOrderAmount?.toFixed(2) || "0.00"}
            </Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View
          style={[
            styles.sectionContainer,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Payment Methods
            </Text>
            <TouchableOpacity onPress={handlePaymentMethods}>
              <Text
                style={[styles.actionText, { color: theme.colors.primary }]}
              >
                Manage
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.paymentMethodsRow}>
            <View
              style={[
                styles.paymentMethod,
                { backgroundColor: theme.colors.gray },
              ]}
            >
              <Icon name="cash" size={20} color={theme.colors.success} />
              <Text
                style={[styles.paymentMethodText, { color: theme.colors.text }]}
              >
                Cash
              </Text>
            </View>

            <View
              style={[
                styles.paymentMethod,
                { backgroundColor: theme.colors.gray },
              ]}
            >
              <Icon name="credit-card" size={20} color={theme.colors.info} />
              <Text
                style={[styles.paymentMethodText, { color: theme.colors.text }]}
              >
                Credit Card
              </Text>
            </View>

            <View
              style={[
                styles.paymentMethod,
                { backgroundColor: theme.colors.gray },
              ]}
            >
              <Icon name="bank" size={20} color={theme.colors.primary} />
              <Text
                style={[styles.paymentMethodText, { color: theme.colors.text }]}
              >
                VNPay
              </Text>
            </View>
          </View>
        </View>

        {/* Additional Settings Button */}
        <TouchableOpacity
          style={[styles.settingsButton, { borderColor: theme.colors.primary }]}
          onPress={() => navigation.navigate("Profile")}
        >
          <Icon name="cog" size={20} color={theme.colors.primary} />
          <Text
            style={[styles.settingsButtonText, { color: theme.colors.primary }]}
          >
            Account Settings
          </Text>
        </TouchableOpacity>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
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
  coverImageContainer: {
    height: 200,
    width: "100%",
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  changeImageButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: -50,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
  },
  changeLogoButton: {
    position: "absolute",
    bottom: 0,
    right: "50%",
    marginRight: -50,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 24,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 12,
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  ratingText: {
    fontSize: 14,
    marginLeft: 8,
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  sectionContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    marginLeft: 12,
    marginRight: 4,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
    marginLeft: 8,
  },
  hoursText: {
    fontSize: 14,
    lineHeight: 22,
  },
  paymentMethodsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 12,
    marginBottom: 8,
  },
  paymentMethodText: {
    fontSize: 14,
    marginLeft: 8,
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 16,
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  bottomPadding: {
    height: 20,
  },
});

export default RestaurantProfileScreen;
