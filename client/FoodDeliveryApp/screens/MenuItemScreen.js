import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../contexts/ThemeContext";
import { useCart } from "../contexts/CartContext";
import { menuService } from "../api/menuService";
import QuantityControl from "../components/general/QuantityControl";
import OptionGroup from "../components/restaurant/OptionGroup";

const { width, height } = Dimensions.get("window");

const MenuItemScreen = ({ route, navigation }) => {
  const { id: itemId, restaurantId, restaurantName } = route.params;
  const { theme } = useTheme();
  const { cart, addItem } = useCart();

  // State
  const [menuItem, setMenuItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);

  // Fetch menu item details
  useEffect(() => {
    const fetchMenuItemDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const item = await menuService.getMenuItem(itemId);
        setMenuItem(item);

        // Initialize selected options
        if (item.options && item.options.length > 0) {
          const initialOptions = {};
          item.options.forEach((option) => {
            if (option.required && !option.multiple) {
              // For required single-selection options, select first item by default
              initialOptions[option.title] = [option.items[0]];
            } else {
              initialOptions[option.title] = [];
            }
          });
          setSelectedOptions(initialOptions);
        }

        // Initialize total price
        setTotalPrice(item.discountedPrice || item.price);
      } catch (err) {
        console.error("Error fetching menu item:", err);
        setError("Failed to load menu item details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItemDetails();
  }, [itemId]);

  // Update total price when quantity or options change
  useEffect(() => {
    if (!menuItem) return;

    let basePrice = menuItem.discountedPrice || menuItem.price;
    let optionsPrice = 0;

    // Calculate options price
    Object.values(selectedOptions).forEach((selections) => {
      selections.forEach((option) => {
        optionsPrice += option.price;
      });
    });

    setTotalPrice((basePrice + optionsPrice) * quantity);
  }, [menuItem, quantity, selectedOptions]);

  // Handle quantity change
  const handleQuantityChange = (newQuantity) => {
    setQuantity(newQuantity);
  };

  // Handle option selection/deselection
  const handleOptionSelect = (optionTitle, item, isSelected) => {
    setSelectedOptions((prev) => {
      const option = menuItem.options.find((opt) => opt.title === optionTitle);
      const currentSelections = [...(prev[optionTitle] || [])];

      if (isSelected) {
        // Add selection
        if (option.multiple) {
          // Multiple selection allowed
          return {
            ...prev,
            [optionTitle]: [...currentSelections, item],
          };
        } else {
          // Single selection only - replace existing
          return {
            ...prev,
            [optionTitle]: [item],
          };
        }
      } else {
        // Remove selection
        return {
          ...prev,
          [optionTitle]: currentSelections.filter(
            (selected) => selected.name !== item.name
          ),
        };
      }
    });
  };

  // Add to cart handler
  const handleAddToCart = () => {
    if (!menuItem) return;

    // Format selected options for cart
    const formattedOptions = Object.entries(selectedOptions)
      .map(([title, items]) => ({
        title,
        items: items.map((item) => ({
          name: item.name,
          price: item.price,
        })),
      }))
      .filter((option) => option.items.length > 0);

    // Create cart item
    const cartItem = {
      menuItemId: menuItem._id,
      name: menuItem.name,
      price: menuItem.discountedPrice || menuItem.price,
      quantity,
      options: formattedOptions,
      totalPrice: totalPrice,
    };

    // Add to cart
    const success = addItem(restaurantId, restaurantName, cartItem);

    if (success) {
      navigation.goBack();
    }
  };

  // Validate if "Add to Cart" should be enabled
  const isAddToCartEnabled = () => {
    if (!menuItem || !menuItem.options) return true;

    // Check that all required options have selections
    for (const option of menuItem.options) {
      if (
        option.required &&
        (!selectedOptions[option.title] ||
          selectedOptions[option.title].length === 0)
      ) {
        return false;
      }
    }

    return true;
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
          Loading menu item details...
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
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.retryButtonText, { color: theme.colors.white }]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render menu item
  if (!menuItem) {
    return null;
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {/* Header Image */}
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: menuItem.image || "https://via.placeholder.com/400x300",
              }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>

          <View style={styles.contentContainer}>
            {/* Item Info */}
            <View style={styles.infoContainer}>
              <Text style={[styles.itemName, { color: theme.colors.text }]}>
                {menuItem.name}
              </Text>

              <Text
                style={[
                  styles.itemDescription,
                  { color: theme.colors.darkGray },
                ]}
              >
                {menuItem.description || "No description available."}
              </Text>

              <View style={styles.priceContainer}>
                {menuItem.discountedPrice !== undefined &&
                menuItem.discountedPrice < menuItem.price ? (
                  <View style={styles.priceRow}>
                    <Text
                      style={[
                        styles.discountedPrice,
                        { color: theme.colors.primary },
                      ]}
                    >
                      ${menuItem.discountedPrice.toFixed(2)}
                    </Text>
                    <Text
                      style={[
                        styles.originalPrice,
                        { color: theme.colors.darkGray },
                      ]}
                    >
                      ${menuItem.price.toFixed(2)}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.price, { color: theme.colors.text }]}>
                    ${menuItem.price.toFixed(2)}
                  </Text>
                )}
              </View>
            </View>

            {/* Item Options */}
            {menuItem.options && menuItem.options.length > 0 && (
              <View style={styles.optionsContainer}>
                <Text
                  style={[styles.optionsTitle, { color: theme.colors.text }]}
                >
                  Customize Your Order
                </Text>

                {menuItem.options.map((optionGroup, index) => (
                  <OptionGroup
                    key={index}
                    optionGroup={optionGroup}
                    selectedItems={selectedOptions[optionGroup.title] || []}
                    onSelect={(item, isSelected) =>
                      handleOptionSelect(optionGroup.title, item, isSelected)
                    }
                  />
                ))}
              </View>
            )}

            {/* Special Instructions */}
            <View
              style={[
                styles.instructionsContainer,
                { borderColor: theme.colors.border },
              ]}
            >
              <Text
                style={[styles.instructionsTitle, { color: theme.colors.text }]}
              >
                Special Instructions
              </Text>
              <TouchableOpacity
                style={[
                  styles.instructionsButton,
                  { backgroundColor: theme.colors.gray },
                ]}
              >
                <Text
                  style={[
                    styles.instructionsButtonText,
                    { color: theme.colors.darkGray },
                  ]}
                >
                  Add note (allergies, preferences, etc.)
                </Text>
                <Icon
                  name="chevron-right"
                  size={20}
                  color={theme.colors.darkGray}
                />
              </TouchableOpacity>
            </View>

            {/* Spacer for bottom buttons */}
            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* Bottom Action Bar */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.quantityContainer}>
            <QuantityControl
              quantity={quantity}
              onDecrease={() => handleQuantityChange(Math.max(1, quantity - 1))}
              onIncrease={() => handleQuantityChange(quantity + 1)}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor: isAddToCartEnabled()
                  ? theme.colors.primary
                  : theme.colors.gray,
              },
            ]}
            onPress={handleAddToCart}
            disabled={!isAddToCartEnabled()}
          >
            <Text
              style={[
                styles.addButtonText,
                {
                  color: isAddToCartEnabled()
                    ? theme.colors.white
                    : theme.colors.darkGray,
                },
              ]}
            >
              Add to Cart - ${totalPrice.toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
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
  imageContainer: {
    width: "100%",
    height: 250,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    padding: 16,
  },
  infoContainer: {
    marginBottom: 24,
  },
  itemName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  priceContainer: {
    marginTop: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
  },
  discountedPrice: {
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 16,
    textDecorationLine: "line-through",
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  instructionsContainer: {
    marginBottom: 24,
    borderTopWidth: 1,
    paddingTop: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  instructionsButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  instructionsButtonText: {
    fontSize: 14,
  },
  bottomSpacer: {
    height: 80,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
  },
  quantityContainer: {
    marginRight: 16,
  },
  addButton: {
    flex: 1,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default MenuItemScreen;
