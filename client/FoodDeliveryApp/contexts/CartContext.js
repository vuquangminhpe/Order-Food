import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({
    restaurantId: null,
    restaurantName: "",
    items: [],
    subtotal: 0,
    deliveryFee: 0,
    serviceCharge: 0,
    discount: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  // Load cart from storage on app start
  useEffect(() => {
    const loadCart = async () => {
      try {
        const storedCart = await AsyncStorage.getItem("cart");
        if (storedCart) {
          setCart(JSON.parse(storedCart));
        }
      } catch (error) {
        console.error("Error loading cart:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, []);

  // Save cart to storage whenever it changes
  useEffect(() => {
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem("cart", JSON.stringify(cart));
      } catch (error) {
        console.error("Error saving cart:", error);
      }
    };

    if (!loading) {
      saveCart();
    }
  }, [cart, loading]);

  // Calculate totals when items change
  const calculateTotals = (
    items,
    deliveryFee = cart.deliveryFee,
    serviceCharge = cart.serviceCharge,
    discount = cart.discount
  ) => {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const total = subtotal + deliveryFee + serviceCharge - discount;

    return {
      subtotal,
      deliveryFee,
      serviceCharge,
      discount,
      total,
    };
  };

  // Add item to cart
  const addItem = (restaurantId, restaurantName, item) => {
    // If cart contains items from a different restaurant, clear it first
    if (cart.restaurantId && cart.restaurantId !== restaurantId) {
      if (
        !window.confirm(
          "Adding items from a different restaurant will clear your current cart. Continue?"
        )
      ) {
        return false;
      }
      clearCart();
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (cartItem) =>
        cartItem.menuItemId === item.menuItemId &&
        JSON.stringify(cartItem.options) === JSON.stringify(item.options)
    );

    let newItems;

    if (existingItemIndex >= 0) {
      // Update existing item quantity
      newItems = [...cart.items];
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity: newItems[existingItemIndex].quantity + item.quantity,
        totalPrice: newItems[existingItemIndex].totalPrice + item.totalPrice,
      };
    } else {
      // Add new item
      newItems = [...cart.items, item];
    }

    const totals = calculateTotals(newItems);

    setCart({
      ...cart,
      restaurantId,
      restaurantName,
      items: newItems,
      ...totals,
    });

    return true;
  };

  // Update item quantity
  const updateItemQuantity = (itemIndex, quantity) => {
    if (quantity <= 0) {
      return removeItem(itemIndex);
    }

    const newItems = [...cart.items];
    const unitPrice =
      newItems[itemIndex].totalPrice / newItems[itemIndex].quantity;

    newItems[itemIndex] = {
      ...newItems[itemIndex],
      quantity,
      totalPrice: unitPrice * quantity,
    };

    const totals = calculateTotals(newItems);

    setCart({
      ...cart,
      items: newItems,
      ...totals,
    });
  };

  // Remove item from cart
  const removeItem = (itemIndex) => {
    const newItems = cart.items.filter((_, index) => index !== itemIndex);

    // If cart is now empty, reset restaurant info
    if (newItems.length === 0) {
      return clearCart();
    }

    const totals = calculateTotals(newItems);

    setCart({
      ...cart,
      items: newItems,
      ...totals,
    });
  };

  // Update delivery fee
  const updateDeliveryFee = (deliveryFee) => {
    const totals = calculateTotals(
      cart.items,
      deliveryFee,
      cart.serviceCharge,
      cart.discount
    );

    setCart({
      ...cart,
      ...totals,
    });
  };

  // Update service charge
  const updateServiceCharge = (serviceCharge) => {
    const totals = calculateTotals(
      cart.items,
      cart.deliveryFee,
      serviceCharge,
      cart.discount
    );

    setCart({
      ...cart,
      ...totals,
    });
  };

  // Apply discount
  const applyDiscount = (discount) => {
    const totals = calculateTotals(
      cart.items,
      cart.deliveryFee,
      cart.serviceCharge,
      discount
    );

    setCart({
      ...cart,
      ...totals,
    });
  };

  // Clear cart
  const clearCart = () => {
    setCart({
      restaurantId: null,
      restaurantName: "",
      items: [],
      subtotal: 0,
      deliveryFee: 0,
      serviceCharge: 0,
      discount: 0,
      total: 0,
    });
  };

  const value = {
    cart,
    loading,
    addItem,
    updateItemQuantity,
    removeItem,
    updateDeliveryFee,
    updateServiceCharge,
    applyDiscount,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
