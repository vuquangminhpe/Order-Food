import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "../contexts/LocationContext";
import { restaurantService } from "../api/restaurantService";
import RestaurantCard from "../components/restaurant/RestaurantCard";
import CategoryCard from "../components/restaurant/CategoryCard";
import PromotionCard from "../components/general/PromotionCard";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");

// Categories for food
const CATEGORIES = [
  { id: "burger", name: "Burgers", icon: "hamburger" },
  { id: "pizza", name: "Pizza", icon: "pizza" },
  { id: "sushi", name: "Sushi", icon: "fish" },
  { id: "salad", name: "Salads", icon: "food-apple" },
  { id: "dessert", name: "Desserts", icon: "cake" },
  { id: "drinks", name: "Drinks", icon: "cup" },
  { id: "vegetarian", name: "Vegetarian", icon: "leaf" },
  { id: "asian", name: "Asian", icon: "food-croissant" },
];

// Mock promotions data
const PROMOTIONS = [
  {
    id: "1",
    title: "Free Delivery",
    description: "Free delivery on your first order",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    code: "FIRSTORDER",
  },
  {
    id: "2",
    title: "20% Off",
    description: "Get 20% off on all orders above $30",
    image:
      "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
    code: "SAVE20",
  },
  {
    id: "3",
    title: "Happy Hour",
    description: "2 for 1 on all drinks between 3-6 PM",
    image:
      "https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1714&q=80",
    code: "HAPPYHOUR",
  },
];

const HomeScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { currentLocation, selectedAddress, getCurrentLocation } =
    useLocation();

  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restaurant data
  const [featuredRestaurants, setFeaturedRestaurants] = useState([]);
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [popularRestaurants, setPopularRestaurants] = useState([]);

  // Filter states
  const [activeCategory, setActiveCategory] = useState(null);

  // Location fetch for nearby restaurants
  const fetchLocation = async () => {
    try {
      if (!currentLocation) {
        await getCurrentLocation();
      }
    } catch (error) {
      console.error("Error getting location:", error);
      setError("Unable to get your location. Some features may be limited.");
    }
  };

  // Fetch all restaurants data
  const fetchRestaurants = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch featured restaurants (highest rated)
      const featuredResponse = await restaurantService.getAllRestaurants({
        sortBy: "rating",
        sortOrder: "desc",
        limit: 5,
      });
      setFeaturedRestaurants(featuredResponse.restaurants);

      // Fetch popular restaurants (most orders)
      const popularResponse = await restaurantService.getAllRestaurants({
        sortBy: "totalRatings",
        sortOrder: "desc",
        limit: 5,
      });
      setPopularRestaurants(popularResponse.restaurants);

      // Fetch nearby restaurants if location is available
      // Trong phần fetchRestaurants khi gọi API
      if (currentLocation?.lat && currentLocation?.lng) {
        const nearbyResponse = await restaurantService.getNearbyRestaurants(
          currentLocation.lat,
          currentLocation.lng,
          5 // 5km radius
        );
        setNearbyRestaurants(nearbyResponse);
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchLocation();
  }, []);

  // Fetch restaurants when location changes
  useEffect(() => {
    if (currentLocation) {
      fetchRestaurants();
    }
  }, [currentLocation]);

  // Refresh data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchRestaurants();
    }, [currentLocation])
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLocation();
    await fetchRestaurants();
  }, [currentLocation]);

  // Category filter
  const handleCategoryPress = (
    categoryId: string | React.SetStateAction<null>
  ) => {
    if (activeCategory === categoryId) {
      setActiveCategory(null); // Unselect if already selected
    } else {
      setActiveCategory(categoryId as any);
      navigation.navigate("CategoryList", { category: categoryId });
    }
  };

  // Search press handler
  const handleSearchPress = () => {
    navigation.navigate("Search");
  };

  // Notification press handler
  const handleNotificationPress = () => {
    navigation.navigate("Notifications");
  };

  // Address press handler - show address selection
  const handleAddressPress = () => {
    navigation.navigate("AddressList", { selectMode: true });
  };

  // Restaurant press handler
  const handleRestaurantPress = (restaurant: any) => {
    navigation.navigate("Restaurant", {
      id: restaurant._id,
      name: restaurant.name,
    });
  };

  // Loading state
  if (isLoading && !refreshing) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Finding delicious food near you...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header with location */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.locationContainer}
          onPress={handleAddressPress}
        >
          <MaterialCommunityIcons
            name="map-marker"
            size={24}
            color={theme.colors.primary}
          />
          <View style={styles.locationTextContainer}>
            <Text
              style={[
                styles.deliverToText,
                { color: theme.colors.placeholder },
              ]}
            >
              Deliver to
            </Text>
            <Text
              style={[styles.locationText, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {selectedAddress
                ? (selectedAddress as any).title
                : currentLocation
                ? "Current Location"
                : "Set your location"}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-down"
            size={20}
            color={theme.colors.text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.notificationButton,
            { backgroundColor: theme.colors.gray },
          ]}
          onPress={handleNotificationPress}
        >
          <MaterialCommunityIcons
            name="bell"
            size={22}
            color={theme.colors.text}
          />
          {/* Notification badge - if there are notifications */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Greeting section */}
        <View style={styles.greetingContainer}>
          <Text style={[styles.greeting, { color: theme.colors.text }]}>
            Hello, {user?.name?.split(" ")[0] || "Guest"}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.placeholder }]}>
            What would you like to eat today?
          </Text>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={[styles.searchBar, { backgroundColor: theme.colors.gray }]}
          onPress={handleSearchPress}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={22}
            color={theme.colors.placeholder}
          />
          <Text
            style={[
              styles.searchPlaceholder,
              { color: theme.colors.placeholder },
            ]}
          >
            Search for restaurants or dishes
          </Text>
        </TouchableOpacity>

        {/* Categories horizontal scroll */}
        <View style={styles.categoriesContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Categories
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContent}
          >
            {CATEGORIES.map((category) => (
              <CategoryCard
                key={category.id}
                title={category.name}
                icon={category.icon}
                isActive={activeCategory === category.id}
                onPress={() => handleCategoryPress(category.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Promotions & Offers */}
        <View style={styles.promotionsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Special Offers
            </Text>
            <TouchableOpacity>
              <Text
                style={[styles.seeAllText, { color: theme.colors.primary }]}
              >
                See All
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.promotionsScroll}
            contentContainerStyle={styles.promotionsContent}
          >
            {PROMOTIONS.map((promotion) => (
              <PromotionCard
                key={promotion.id}
                title={promotion.title}
                description={promotion.description}
                image={promotion.image}
                code={promotion.code}
              />
            ))}
          </ScrollView>
        </View>

        {/* Nearby Restaurants Section */}
        {nearbyRestaurants && nearbyRestaurants.length > 0 && (
          <View style={styles.restaurantsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Nearby You
              </Text>
              <TouchableOpacity>
                <Text
                  style={[styles.seeAllText, { color: theme.colors.primary }]}
                >
                  See All
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={nearbyRestaurants}
              keyExtractor={(item: any) => item._id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.restaurantsContent}
              renderItem={({ item }) => (
                <RestaurantCard
                  restaurant={item}
                  onPress={() => handleRestaurantPress(item)}
                />
              )}
            />
          </View>
        )}

        {/* Featured Restaurants Section */}
        {featuredRestaurants && featuredRestaurants.length > 0 && (
          <View style={styles.restaurantsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Top Rated
              </Text>
              <TouchableOpacity>
                <Text
                  style={[styles.seeAllText, { color: theme.colors.primary }]}
                >
                  See All
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={featuredRestaurants}
              keyExtractor={(item: any) => item._id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.restaurantsContent}
              renderItem={({ item }) => (
                <RestaurantCard
                  restaurant={item}
                  onPress={() => handleRestaurantPress(item)}
                />
              )}
            />
          </View>
        )}

        {/* Popular Restaurants Section */}
        {popularRestaurants && popularRestaurants.length > 0 && (
          <View style={styles.restaurantsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Most Popular
              </Text>
              <TouchableOpacity>
                <Text
                  style={[styles.seeAllText, { color: theme.colors.primary }]}
                >
                  See All
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={popularRestaurants}
              keyExtractor={(item: any) => item._id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.restaurantsContent}
              renderItem={({ item }) => (
                <RestaurantCard
                  restaurant={item}
                  onPress={() => handleRestaurantPress(item)}
                />
              )}
            />
          </View>
        )}

        {/* Error message if any */}
        {error && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={24}
              color={theme.colors.error}
            />
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          </View>
        )}

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  deliverToText: {
    fontSize: 12,
  },
  locationText: {
    fontSize: 14,
    fontWeight: "500",
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  greetingContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchPlaceholder: {
    marginLeft: 8,
    fontSize: 14,
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  categoriesScroll: {
    paddingLeft: 16,
  },
  categoriesContent: {
    paddingRight: 16,
  },
  promotionsContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingRight: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  promotionsScroll: {
    paddingLeft: 16,
  },
  promotionsContent: {
    paddingRight: 16,
  },
  restaurantsSection: {
    marginBottom: 24,
  },
  restaurantsContent: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    flexDirection: "row",
    alignItems: "center",
  },
  errorText: {
    marginLeft: 8,
    flex: 1,
  },
  bottomPadding: {
    height: 40,
  },
});

export default HomeScreen;
