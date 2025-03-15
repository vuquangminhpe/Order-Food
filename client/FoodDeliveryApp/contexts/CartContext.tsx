import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const CartContext = createContext<{
  cart: Cart;
  loading: boolean;
  addItem: (restaurantId: any, restaurantName: any, item: any) => boolean;
  updateItemQuantity: (itemIndex: number, quantity: number) => void;
  removeItem: (itemIndex: number) => void;
  updateDeliveryFee: (deliveryFee: number) => void;
  updateServiceCharge: (serviceCharge: number) => void;
  applyDiscount: (discount: number) => void;
  clearCart: () => void;
}>({
  cart: {
    restaurantId: null,
    restaurantName: "",
    items: [],
    subtotal: 0,
    deliveryFee: 0,
    serviceCharge: 0,
    discount: 0,
    total: 0,
  },
  loading: true,
  addItem: () => true,
  updateItemQuantity: () => {},
  removeItem: () => {},
  updateDeliveryFee: () => {},
  updateServiceCharge: () => {},
  applyDiscount: () => {},
  clearCart: () => {},
});

export const useCart = () => useContext(CartContext);

interface CartItem {
  menuItemId: string;
  options: any;
  quantity: number;
  totalPrice: number;
}

interface Cart {
  restaurantId: string | null;
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  serviceCharge: number;
  discount: number;
  total: number;
}

export const CartProvider = ({ children }: any) => {
  const [cart, setCart] = useState<Cart>({
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
    items: any[],
    deliveryFee = cart.deliveryFee,
    serviceCharge = cart.serviceCharge,
    discount = cart.discount
  ) => {
    const subtotal = items.reduce(
      (sum: any, item: { totalPrice: any }) => sum + item.totalPrice,
      0
    );
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
  const addItem = (
    restaurantId: any,
    restaurantName: any,
    item: { menuItemId: any; options: any; quantity: any; totalPrice: any }
  ) => {
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
      (cartItem: any) =>
        cartItem.menuItemId === item.menuItemId &&
        JSON.stringify(cartItem.options) === JSON.stringify(item.options)
    );

    let newItems: any[];

    if (existingItemIndex >= 0) {
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
      items: newItems as unknown as any[],
      ...totals,
    });

    return true;
  };

  // Update item quantity
  const updateItemQuantity = (
    itemIndex: string | number | any,
    quantity: number
  ) => {
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
  const removeItem = (itemIndex: number) => {
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
  const updateDeliveryFee = (deliveryFee: number | undefined) => {
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
  const updateServiceCharge = (serviceCharge: number | undefined) => {
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
  const applyDiscount = (discount: number | undefined) => {
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
