import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  SafeAreaView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { restaurantService } from "../api/restaurantService";
import { menuService } from "../api/menuService";
import RestaurantCard from "../components/restaurant/RestaurantCard";
import MenuItem from "../components/restaurant/MenuItem";
import { debounce } from "lodash";

const SearchScreen = ({ navigation }: any) => {
  const { theme } = useTheme();

  // State
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("restaurants"); // 'restaurants' or 'menu'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restaurantResults, setRestaurantResults] = useState([]);
  const [menuResults, setMenuResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from storage
  useEffect(() => {
    // This would normally load from AsyncStorage
    setRecentSearches(["Pizza", "Burger", "Sushi", "Thai Food", "Dessert"]);
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (text) => {
      if (!text.trim()) {
        setRestaurantResults([]);
        setMenuResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Search restaurants
        const restaurantResponse = await restaurantService.getAllRestaurants({
          search: text,
          limit: 20,
        });
        setRestaurantResults(restaurantResponse.restaurants || []);

        // In a real app, would search menu items as well
        // For demo purposes, we'll just show empty results
        setMenuResults([]);
      } catch (err) {
        console.error("Search error:", err);
        setError("Failed to search. Please try again.");
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  // Trigger search when search text changes
  useEffect(() => {
    debouncedSearch(searchText);
    return () => debouncedSearch.cancel();
  }, [searchText, debouncedSearch]);

  // Handle search text change
  const handleSearchChange = (text: React.SetStateAction<string>) => {
    setSearchText(text);
  };

  // Handle tab change
  const handleTabChange = (tab: React.SetStateAction<string>) => {
    setActiveTab(tab);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchText("");
    setRestaurantResults([]);
    setMenuResults([]);
  };

  // Handle recent search press
  const handleRecentSearchPress = (term: React.SetStateAction<string>) => {
    setSearchText(term);
  };

  // Handle restaurant press
  const handleRestaurantPress = (restaurant: any) => {
    // Add to recent searches (would normally save to AsyncStorage)
    // In a real app, would avoid duplicates and limit the number of recent searches

    // Navigate to restaurant screen
    navigation.navigate("Restaurant", {
      id: restaurant._id,
      name: restaurant.name,
    });
  };

  // Handle menu item press
  const handleMenuItemPress = (item: any) => {
    // Add to recent searches (would normally save to AsyncStorage)

    // Navigate to menu item screen
    navigation.navigate("MenuItem", {
      id: item._id,
      name: item.name,
      restaurantId: item.restaurantId,
    });
  };

  // Render search bar
  const renderSearchBar = () => (
    <View style={styles.searchBarContainer}>
      <View style={[styles.searchBar, { backgroundColor: theme.colors.gray }]}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={theme.colors.darkGray}
        />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search for restaurants or food"
          placeholderTextColor={theme.colors.placeholder}
          value={searchText}
          onChangeText={handleSearchChange}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch}>
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color={theme.colors.darkGray}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Render tabs
  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === "restaurants" && [
            styles.activeTab,
            { borderBottomColor: theme.colors.primary },
          ],
        ]}
        onPress={() => handleTabChange("restaurants")}
      >
        <Text
          style={[
            styles.tabText,
            {
              color:
                activeTab === "restaurants"
                  ? theme.colors.primary
                  : theme.colors.darkGray,
            },
          ]}
        >
          Restaurants
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === "menu" && [
            styles.activeTab,
            { borderBottomColor: theme.colors.primary },
          ],
        ]}
        onPress={() => handleTabChange("menu")}
      >
        <Text
          style={[
            styles.tabText,
            {
              color:
                activeTab === "menu"
                  ? theme.colors.primary
                  : theme.colors.darkGray,
            },
          ]}
        >
          Menu Items
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render recent searches
  const renderRecentSearches = () => (
    <View style={styles.recentSearchesContainer}>
      <View style={styles.recentSearchesHeader}>
        <Text
          style={[styles.recentSearchesTitle, { color: theme.colors.text }]}
        >
          Recent Searches
        </Text>
        <TouchableOpacity onPress={() => setRecentSearches([])}>
          <Text style={[styles.clearText, { color: theme.colors.primary }]}>
            Clear All
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentSearchesList}>
        {recentSearches.map((term, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.recentSearchItem,
              { backgroundColor: theme.colors.gray },
            ]}
            onPress={() => handleRecentSearchPress(term)}
          >
            <MaterialCommunityIcons
              name="history"
              size={16}
              color={theme.colors.darkGray}
            />
            <Text
              style={[styles.recentSearchText, { color: theme.colors.text }]}
            >
              {term}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render restaurant results
  const renderRestaurantResults = () => (
    <FlatList
      data={restaurantResults}
      keyExtractor={(item: any) => item._id.toString()}
      renderItem={({ item }) => (
        <RestaurantCard
          restaurant={item}
          onPress={() => handleRestaurantPress(item)}
          style={styles.restaurantCard}
          horizontal={false}
        />
      )}
      ListEmptyComponent={() => (
        <View style={styles.emptyListContainer}>
          {loading ? (
            <ActivityIndicator color={theme.colors.primary} size="large" />
          ) : searchText.trim() !== "" ? (
            <Text
              style={[styles.emptyListText, { color: theme.colors.darkGray }]}
            >
              No restaurants found matching "{searchText}"
            </Text>
          ) : null}
        </View>
      )}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.resultsList}
    />
  );

  // Render menu results
  const renderMenuResults = () => (
    <FlatList
      data={menuResults}
      keyExtractor={(item: any) => item._id.toString()}
      renderItem={({ item }) => (
        <MenuItem item={item} onPress={() => handleMenuItemPress(item)} />
      )}
      ListEmptyComponent={() => (
        <View style={styles.emptyListContainer}>
          {loading ? (
            <ActivityIndicator color={theme.colors.primary} size="large" />
          ) : searchText.trim() !== "" ? (
            <Text
              style={[styles.emptyListText, { color: theme.colors.darkGray }]}
            >
              No menu items found matching "{searchText}"
            </Text>
          ) : null}
        </View>
      )}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.resultsList}
    />
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {/* Search Bar */}
        {renderSearchBar()}

        {/* Tabs for filtering results */}
        {renderTabs()}

        {/* Main Content */}
        {searchText.trim() === "" ? (
          renderRecentSearches()
        ) : (
          <View style={styles.resultsContainer}>
            {activeTab === "restaurants"
              ? renderRestaurantResults()
              : renderMenuResults()}
          </View>
        )}

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
    padding: 16,
  },
  searchBarContainer: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    padding: 0,
  },
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
  },
  recentSearchesContainer: {
    marginTop: 8,
  },
  recentSearchesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recentSearchesTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  clearText: {
    fontSize: 14,
  },
  recentSearchesList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  recentSearchItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  recentSearchText: {
    fontSize: 14,
    marginLeft: 6,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsList: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  restaurantCard: {
    marginBottom: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: 40,
  },
  emptyListText: {
    fontSize: 16,
    textAlign: "center",
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

export default SearchScreen;
