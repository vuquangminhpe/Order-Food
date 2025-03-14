import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { menuService } from "../api/menuService";
import { Image } from "react-native";

const MenuManagementScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [menuCategories, setMenuCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [error, setError] = useState(null);

  // Fetch menu data
  const fetchMenuData = async () => {
    try {
      setError(null);
      if (!refreshing) {
        setLoading(true);
      }

      // Get restaurant ID from user
      const restaurantId = user?.restaurantId || "1"; // Fallback to a default ID for demo

      // Fetch menu categories
      const categoriesResponse = await menuService.getMenuCategories(
        restaurantId
      );
      setMenuCategories(categoriesResponse);

      // Set the first category as active if one exists and none is selected
      if (categoriesResponse.length > 0 && !activeCategory) {
        setActiveCategory(categoriesResponse[0]._id);
      }

      // Fetch complete menu
      const menuResponse = await menuService.getRestaurantMenu(restaurantId);
      setMenuItems(menuResponse);

      // Filter items by the active category
      filterItemsByCategory(
        menuResponse,
        activeCategory ||
          (categoriesResponse.length > 0 ? categoriesResponse[0]._id : null)
      );
    } catch (err) {
      console.error("Error fetching menu data:", err);
      setError("Failed to load menu data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMenuData();
  }, []);

  // Filter items when active category changes
  useEffect(() => {
    filterItemsByCategory(menuItems, activeCategory);
  }, [activeCategory]);

  // Filter items when search text changes
  useEffect(() => {
    if (activeCategory) {
      const filtered = menuItems.filter(
        (item) =>
          item.categoryId === activeCategory &&
          item.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredItems(filtered);
    } else {
      const filtered = menuItems.filter((item) =>
        item.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchText, menuItems, activeCategory]);

  // Filter items by category
  const filterItemsByCategory = (items, categoryId) => {
    if (!categoryId) {
      setFilteredItems(items);
      return;
    }

    const filtered = items.filter((item) => item.categoryId === categoryId);
    setFilteredItems(filtered);
  };

  // Handle category press
  const handleCategoryPress = (categoryId) => {
    setActiveCategory(categoryId);
  };

  // Handle add menu item
  const handleAddMenuItem = () => {
    navigation.navigate("AddMenuItem", { categories: menuCategories });
  };

  // Handle edit menu item
  const handleEditMenuItem = (item) => {
    navigation.navigate("EditMenuItem", { item, categories: menuCategories });
  };

  // Handle delete menu item
  const handleDeleteMenuItem = (itemId) => {
    Alert.alert(
      "Delete Menu Item",
      "Are you sure you want to delete this menu item?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await menuService.deleteMenuItem(itemId);

              // Update the menu items list
              setMenuItems((prevItems) =>
                prevItems.filter((item) => item._id !== itemId)
              );

              Alert.alert("Success", "Menu item deleted successfully");
            } catch (error) {
              console.error("Delete menu item error:", error);
              Alert.alert("Error", "Failed to delete menu item");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle toggle item availability
  const handleToggleAvailability = async (itemId, currentValue) => {
    try {
      const newAvailability = !currentValue;

      // Update UI immediately for better UX
      setMenuItems((prevItems) =>
        prevItems.map((item) =>
          item._id === itemId ? { ...item, isAvailable: newAvailability } : item
        )
      );

      // Update on the server
      await menuService.updateMenuItemAvailability(itemId, newAvailability);
    } catch (error) {
      console.error("Toggle availability error:", error);

      // Revert UI change on error
      setMenuItems((prevItems) =>
        prevItems.map((item) =>
          item._id === itemId ? { ...item, isAvailable: currentValue } : item
        )
      );

      Alert.alert("Error", "Failed to update item availability");
    }
  };

  // Add category
  const handleAddCategory = () => {
    Alert.prompt(
      "Add Category",
      "Enter a name for the new category:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add",
          onPress: async (name) => {
            if (!name || name.trim() === "") return;

            try {
              setLoading(true);
              const restaurantId = user?.restaurantId || "1"; // Fallback to a default ID for demo

              const newCategory = await menuService.createMenuCategory({
                name: name.trim(),
                restaurantId,
              });

              // Update categories list
              setMenuCategories((prev) => [...prev, newCategory]);
              setActiveCategory(newCategory._id);
            } catch (error) {
              console.error("Add category error:", error);
              Alert.alert("Error", "Failed to add category");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      "plain-text"
    );
  };

  // Refresh menu data
  const onRefresh = () => {
    setRefreshing(true);
    fetchMenuData();
  };

  // Render category item
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        activeCategory === item._id && [
          styles.activeCategory,
          { borderColor: theme.colors.primary },
        ],
      ]}
      onPress={() => handleCategoryPress(item._id)}
    >
      <Text
        style={[
          styles.categoryName,
          {
            color:
              activeCategory === item._id
                ? theme.colors.primary
                : theme.colors.text,
          },
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // Render menu item
  const renderMenuItem = ({ item }) => (
    <View style={[styles.menuItem, { backgroundColor: theme.colors.card }]}>
      <Image
        source={{ uri: item.image || "https://via.placeholder.com/100" }}
        style={styles.menuItemImage}
      />

      <View style={styles.menuItemContent}>
        <View style={styles.menuItemHeader}>
          <Text style={[styles.menuItemName, { color: theme.colors.text }]}>
            {item.name}
          </Text>
          <Switch
            value={item.isAvailable}
            onValueChange={() =>
              handleToggleAvailability(item._id, item.isAvailable)
            }
            trackColor={{
              false: theme.colors.gray,
              true: theme.colors.primary,
            }}
            thumbColor={
              item.isAvailable ? theme.colors.white : theme.colors.placeholder
            }
          />
        </View>

        <Text
          style={[styles.menuItemDescription, { color: theme.colors.darkGray }]}
          numberOfLines={2}
        >
          {item.description || "No description available"}
        </Text>

        <View style={styles.menuItemFooter}>
          <Text style={[styles.menuItemPrice, { color: theme.colors.text }]}>
            ${(item.discountedPrice || item.price).toFixed(2)}
            {item.discountedPrice && item.discountedPrice < item.price && (
              <Text
                style={[
                  styles.menuItemOriginalPrice,
                  { color: theme.colors.darkGray },
                ]}
              >
                ${item.price.toFixed(2)}
              </Text>
            )}
          </Text>

          <View style={styles.menuItemActions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => handleEditMenuItem(item)}
            >
              <Icon name="pencil" size={16} color={theme.colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.error },
              ]}
              onPress={() => handleDeleteMenuItem(item._id)}
            >
              <Icon name="delete" size={16} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="food-off" size={60} color={theme.colors.placeholder} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No menu items found
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.darkGray }]}>
        {searchText
          ? `No results found for "${searchText}"`
          : activeCategory
          ? "Add menu items to this category"
          : "Select a category or add a new one"}
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
          Loading menu...
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
        {/* Search and Add Section */}
        <View style={styles.searchContainer}>
          <View
            style={[styles.searchBar, { backgroundColor: theme.colors.gray }]}
          >
            <Icon name="magnify" size={20} color={theme.colors.placeholder} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search menu items"
              placeholderTextColor={theme.colors.placeholder}
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Icon
                  name="close-circle"
                  size={20}
                  color={theme.colors.darkGray}
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleAddMenuItem}
          >
            <Icon name="plus" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        </View>

        {/* Categories List */}
        <View style={styles.categoriesContainer}>
          <FlatList
            data={menuCategories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item._id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
            ListFooterComponent={
              <TouchableOpacity
                style={[
                  styles.addCategoryButton,
                  { borderColor: theme.colors.primary },
                ]}
                onPress={handleAddCategory}
              >
                <Icon name="plus" size={16} color={theme.colors.primary} />
                <Text
                  style={[
                    styles.addCategoryText,
                    { color: theme.colors.primary },
                  ]}
                >
                  Add Category
                </Text>
              </TouchableOpacity>
            }
          />
        </View>

        {/* Menu Items List */}
        <FlatList
          data={filteredItems}
          renderItem={renderMenuItem}
          keyExtractor={(item) => item._id.toString()}
          contentContainerStyle={styles.menuItemsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />

        {/* Add Menu Item Button */}
        <TouchableOpacity
          style={[
            styles.floatingButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={handleAddMenuItem}
        >
          <Icon name="plus" size={24} color={theme.colors.white} />
        </TouchableOpacity>

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
            <TouchableOpacity
              style={[
                styles.retryButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={fetchMenuData}
            >
              <Text
                style={[styles.retryButtonText, { color: theme.colors.white }]}
              >
                Retry
              </Text>
            </TouchableOpacity>
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
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  categoriesContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    marginRight: 8,
  },
  activeCategory: {
    backgroundColor: "rgba(255, 90, 95, 0.1)",
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "500",
  },
  addCategoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  addCategoryText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  menuItemsList: {
    padding: 16,
  },
  menuItem: {
    flexDirection: "row",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  menuItemImage: {
    width: 100,
    height: 100,
  },
  menuItemContent: {
    flex: 1,
    padding: 12,
  },
  menuItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  menuItemDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  menuItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: "bold",
  },
  menuItemOriginalPrice: {
    fontSize: 14,
    textDecorationLine: "line-through",
    marginLeft: 4,
  },
  menuItemActions: {
    flexDirection: "row",
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  floatingButton: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
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
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  retryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default MenuManagementScreen;
