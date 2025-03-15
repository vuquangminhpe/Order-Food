import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../contexts/ThemeContext";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "../contexts/LocationContext";
import CartItem from "../components/cart/CartItem.js";
import PriceBreakdown from "../components/cart/PriceBreakdown";
import EmptyState from "../components/cart/EmptyState";

const CartScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const {
    cart,
    loading: cartLoading,
    updateItemQuantity,
    removeItem,
    clearCart,
  } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { selectedAddress } = useLocation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if cart is empty
  const isCartEmpty = !cart.items || cart.items.length === 0;

  // Validate if user can checkout
  const canCheckout = () => {
    if (!isAuthenticated()) {
      return false;
    }

    if (isCartEmpty) {
      return false;
    }

    // In a real app, would check if restaurant is open,
    // minimum order amount is met, etc.
    return true;
  };

  // Handle proceed to checkout
  const handleCheckout = () => {
    if (!isAuthenticated()) {
      // Prompt user to log in first
      Alert.alert(
        "Sign In Required",
        "Please sign in to complete your order.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sign In",
            onPress: () => navigation.navigate("Auth", { screen: "Login" }),
          },
        ]
      );
      return;
    }

    if (!selectedAddress) {
      // Prompt user to select delivery address
      Alert.alert(
        "Delivery Address Required",
        "Please select a delivery address for your order.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add Address",
            onPress: () => navigation.navigate("AddAddress"),
          },
        ]
      );
      return;
    }

    // Navigate to checkout screen
    navigation.navigate("Checkout");
  };

  // Handle clear cart
  const handleClearCart = () => {
    if (isCartEmpty) return;

    Alert.alert("Clear Cart", "Are you sure you want to clear your cart?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        onPress: () => clearCart(),
        style: "destructive",
      },
    ]);
  };

  // Handle quantity update
  const handleUpdateQuantity = (index: any, quantity: any) => {
    if (quantity <= 0) {
      handleRemoveItem(index);
      return;
    }

    updateItemQuantity(index, quantity);
  };

  // Handle remove item
  const handleRemoveItem = (index: any) => {
    Alert.alert("Remove Item", "Are you sure you want to remove this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        onPress: () => removeItem(index),
        style: "destructive",
      },
    ]);
  };

  // Render cart item
  const renderCartItem = ({ item, index }: any) => (
    <CartItem
      item={item}
      onUpdateQuantity={(quantity: any) =>
        handleUpdateQuantity(index, quantity)
      }
      onRemove={() => handleRemoveItem(index)}
      onPress={() => {
        // Navigate to menu item details for editing
        navigation.navigate("MenuItem", {
          id: item.menuItemId,
          restaurantId: cart.restaurantId,
          restaurantName: cart.restaurantName,
          edit: true,
        });
      }}
    />
  );

  // Render empty cart
  const renderEmptyCart = () => (
    <EmptyState
      icon="cart-outline"
      title="Your cart is empty"
      description="Add items from a restaurant to start your order."
      buttonText="Browse Restaurants"
      onButtonPress={() => navigation.navigate("Home")}
    />
  );

  // Render loading state
  if (cartLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading your cart...
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
        {/* Header with restaurant info */}
        {!isCartEmpty && (
          <View
            style={[
              styles.restaurantHeader,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.cartTitle, { color: theme.colors.text }]}>
              Your Order From
            </Text>
            <Text style={[styles.restaurantName, { color: theme.colors.text }]}>
              {cart.restaurantName}
            </Text>

            {/* Clear cart button */}
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearCart}
            >
              <Text
                style={[styles.clearButtonText, { color: theme.colors.error }]}
              >
                Clear
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cart items */}
        {isCartEmpty ? (
          renderEmptyCart()
        ) : (
          <FlatList
            data={cart.items}
            keyExtractor={(item, index) => `${item.menuItemId}-${index}`}
            renderItem={renderCartItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cartItemsContainer}
            ListFooterComponent={() => (
              <View>
                {/* Price breakdown */}
                <PriceBreakdown
                  subtotal={cart.subtotal}
                  deliveryFee={cart.deliveryFee}
                  serviceCharge={cart.serviceCharge}
                  discount={cart.discount}
                  total={cart.total}
                />

                {/* Promo code section */}
                <TouchableOpacity
                  style={[
                    styles.promoSection,
                    { backgroundColor: theme.colors.gray },
                  ]}
                >
                  <Icon
                    name="ticket-percent"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[styles.promoText, { color: theme.colors.text }]}
                  >
                    Add Promo Code
                  </Text>
                  <Icon
                    name="chevron-right"
                    size={20}
                    color={theme.colors.darkGray}
                  />
                </TouchableOpacity>

                {/* Space for the bottom button */}
                <View style={{ height: 100 }} />
              </View>
            )}
          />
        )}

        {/* Checkout button */}
        {!isCartEmpty && (
          <View
            style={[
              styles.checkoutContainer,
              {
                backgroundColor: theme.colors.background,
                borderTopColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.totalContainer}>
              <Text
                style={[styles.totalLabel, { color: theme.colors.darkGray }]}
              >
                Total
              </Text>
              <Text style={[styles.totalAmount, { color: theme.colors.text }]}>
                ${cart.total.toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.checkoutButton,
                {
                  backgroundColor: canCheckout()
                    ? theme.colors.primary
                    : theme.colors.gray,
                },
              ]}
              onPress={handleCheckout}
              disabled={!canCheckout()}
            >
              <Text
                style={[
                  styles.checkoutButtonText,
                  {
                    color: canCheckout()
                      ? theme.colors.white
                      : theme.colors.darkGray,
                  },
                ]}
              >
                Proceed to Checkout
              </Text>
              <Icon
                name="arrow-right"
                size={20}
                color={
                  canCheckout() ? theme.colors.white : theme.colors.darkGray
                }
              />
            </TouchableOpacity>
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
  restaurantHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  cartTitle: {
    fontSize: 14,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
  },
  clearButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  cartItemsContainer: {
    padding: 16,
  },
  promoSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  promoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: "500",
  },
  checkoutContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  totalContainer: {
    marginRight: 16,
  },
  totalLabel: {
    fontSize: 12,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  checkoutButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 8,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: "bold",
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

export default CartScreen;
