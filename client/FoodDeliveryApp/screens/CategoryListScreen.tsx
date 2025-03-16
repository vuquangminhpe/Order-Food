import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { restaurantService } from "../api/restaurantService";
import RestaurantCard from "../components/restaurant/RestaurantCard";
import EmptyState from "../components/cart/EmptyState";

const CategoryListScreen = ({ route, navigation }: any) => {
  const { category } = route.params as any;
  const { theme } = useTheme();

  // State
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Get category info - name and icon
  const getCategoryInfo = () => {
    // Map of categories to their display names and icons
    const categoryMap = {
      burger: { name: "Burgers", icon: "hamburger" },
      pizza: { name: "Pizza", icon: "pizza" },
      sushi: { name: "Sushi", icon: "fish" },
      salad: { name: "Salads", icon: "food-apple" },
      dessert: { name: "Desserts", icon: "cake" },
      drinks: { name: "Drinks", icon: "cup" },
      vegetarian: { name: "Vegetarian", icon: "leaf" },
      asian: { name: "Asian", icon: "food-croissant" },
      // Add more categories as needed
    };

    return (
      categoryMap[category as keyof typeof categoryMap] || {
        name: category,
        icon: "food",
      }
    );
  };

  // Fetch restaurants by category
  const fetchRestaurants = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      setError(null);

      const results = await restaurantService.getRestaurantsByCategory(
        category,
        pageNum,
        10
      );

      if (refresh || pageNum === 1) {
        setRestaurants(results.restaurants);
      } else {
        setRestaurants((prevRestaurants) => [
          ...prevRestaurants,
          ...results.restaurants,
        ]);
      }

      setTotalPages(results.pagination.pages);
      setPage(pageNum);
    } catch (err) {
      console.error("Error fetching restaurants by category:", err);
      setError("Failed to load restaurants. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchRestaurants();
  }, [category]);

  // Handle refresh
  const handleRefresh = () => {
    fetchRestaurants(1, true);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (isLoadingMore || page >= totalPages) return;
    fetchRestaurants(page + 1);
  };

  // Handle restaurant press
  const handleRestaurantPress = (restaurant: any) => {
    navigation.navigate("Restaurant", {
      id: restaurant._id,
      name: restaurant.name,
    });
  };

  // Get category info
  const categoryInfo = getCategoryInfo();

  // Render header with category info
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: theme.colors.primary },
        ]}
      >
        <MaterialCommunityIcons
          name={categoryInfo.icon}
          size={24}
          color={theme.colors.white}
        />
      </View>
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
        {categoryInfo.name} Restaurants
      </Text>
    </View>
  );

  // Render loading state
  if (loading && !refreshing) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading restaurants...
        </Text>
      </View>
    );
  }

  // Render list footer
  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={[styles.footerText, { color: theme.colors.darkGray }]}>
          Loading more restaurants...
        </Text>
      </View>
    );
  };

  // Render empty state
  const renderEmpty = () => (
    <EmptyState
      icon="food-off"
      title={`No ${categoryInfo.name} Restaurants Found`}
      description="We couldn't find any restaurants in this category. Try searching for something else."
      buttonText="Go Back"
      onButtonPress={() => navigation.goBack()}
    />
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {/* Category Header */}
        {renderHeader()}

        {/* Restaurants List */}
        <FlatList
          data={restaurants}
          keyExtractor={(item: any) => item._id.toString()}
          renderItem={({ item }) => (
            <RestaurantCard
              restaurant={item}
              onPress={() => handleRestaurantPress(item)}
              style={styles.restaurantCard}
              horizontal={false}
            />
          )}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />

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
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexGrow: 1,
  },
  restaurantCard: {
    marginTop: 16,
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
  },
  errorContainer: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
  },
});

export default CategoryListScreen;
