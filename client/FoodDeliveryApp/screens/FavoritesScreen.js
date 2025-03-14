import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { restaurantService } from "../../api/restaurantService";
import RestaurantListItem from "../../components/restaurant/RestaurantListItem";
import EmptyState from "../../components/general/EmptyState";
import { useFocusEffect } from "@react-navigation/native";

// Mock API service for favorites since the server doesn't have direct endpoints
const favoritesService = {
  async getFavorites() {
    // In a real app, we would call an API to get user's favorites
    // For now, return mock data with some delay to simulate network call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          favorites: [
            {
              _id: "1",
              restaurantId: "1",
              name: "Burger Joint",
              image:
                "https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YnVyZ2VyfGVufDB8fDB8fHww&w=1000&q=80",
              rating: 4.5,
              categories: ["Burger", "Fast Food"],
              deliveryTime: "20-30 min",
              deliveryFee: 2.99,
            },
            {
              _id: "2",
              restaurantId: "2",
              name: "Pizza Palace",
              image:
                "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGl6emF8ZW58MHx8MHx8fDA%3D&w=1000&q=80",
              rating: 4.2,
              categories: ["Pizza", "Italian"],
              deliveryTime: "25-40 min",
              deliveryFee: 3.99,
            },
            {
              _id: "3",
              restaurantId: "3",
              name: "Sushi World",
              image:
                "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c3VzaGl8ZW58MHx8MHx8fDA%3D&w=1000&q=80",
              rating: 4.8,
              categories: ["Japanese", "Sushi"],
              deliveryTime: "30-45 min",
              deliveryFee: 4.99,
            },
          ],
        });
      }, 800);
    });
  },

  async removeFavorite(id) {
    // In a real app, we would call an API to remove a favorite
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 500);
    });
  },

  async addFavorite(id) {
    // In a real app, we would call an API to add a favorite
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 500);
    });
  },
};

const FavoritesScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();

  // State
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch favorites when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [])
  );

  // Fetch favorites
  const fetchFavorites = async () => {
    try {
      setError(null);

      if (!isAuthenticated()) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const { favorites: favoritesData } =
        await favoritesService.getFavorites();
      setFavorites(favoritesData);
    } catch (err) {
      console.error("Error fetching favorites:", err);
      setError("Failed to load your favorites. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Remove a restaurant from favorites
  const handleRemoveFavorite = (id) => {
    Alert.alert(
      "Remove from Favorites",
      "Are you sure you want to remove this restaurant from your favorites?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await favoritesService.removeFavorite(id);
              // Update local state
              setFavorites((prevFavorites) =>
                prevFavorites.filter((item) => item._id !== id)
              );
            } catch (err) {
              console.error("Error removing favorite:", err);
              setError("Failed to remove restaurant from favorites.");
            }
          },
        },
      ]
    );
  };

  // Navigate to restaurant details
  const handlePressRestaurant = (restaurant) => {
    navigation.navigate("Restaurant", {
      id: restaurant.restaurantId,
      name: restaurant.name,
    });
  };

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFavorites();
  }, []);

  // Render restaurant item
  const renderRestaurantItem = ({ item }) => (
    <RestaurantListItem
      restaurant={item}
      onPress={() => handlePressRestaurant(item)}
      onFavoritePress={() => handleRemoveFavorite(item._id)}
      isFavorite={true}
    />
  );

  // Render empty state when no favorites
  const renderEmptyState = () => {
    if (!isAuthenticated()) {
      return (
        <EmptyState
          icon="login"
          title="Sign in to see your favorites"
          description="Your favorite restaurants will appear here after you sign in."
          buttonText="Sign In"
          onButtonPress={() => navigation.navigate("Auth", { screen: "Login" })}
        />
      );
    }

    return (
      <EmptyState
        icon="heart-outline"
        title="No favorites yet"
        description="Add restaurants to your favorites to see them here."
        buttonText="Browse Restaurants"
        onButtonPress={() => navigation.navigate("Home")}
      />
    );
  };

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
          Loading your favorites...
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
        {/* Header */}
        <View
          style={[styles.header, { borderBottomColor: theme.colors.border }]}
        >
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Your Favorites
          </Text>
        </View>

        {/* Favorites List */}
        {favorites.length > 0 ? (
          <FlatList
            data={favorites}
            keyExtractor={(item) => item._id.toString()}
            renderItem={renderRestaurantItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          >
            {renderEmptyState()}
          </ScrollView>
        )}

        {/* Error message if any */}
        {error && (
          <View
            style={[
              styles.errorContainer,
              { backgroundColor: "rgba(255, 0, 0, 0.1)" },
            ]}
          >
            <Icon name="alert-circle" size={20} color={theme.colors.error} />
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorContainer: {
    margin: 16,
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

export default FavoritesScreen;
