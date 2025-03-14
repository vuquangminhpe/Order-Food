import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../contexts/ThemeContext";

// Import customer screens
import HomeScreen from "../screens/customer/HomeScreen";
import RestaurantScreen from "../screens/customer/RestaurantScreen";
import MenuItemScreen from "../screens/customer/MenuItemScreen";
import CartScreen from "../screens/customer/CartScreen";
import CheckoutScreen from "../screens/customer/CheckoutScreen";
import OrderConfirmationScreen from "../screens/customer/OrderConfirmationScreen";
import OrderTrackingScreen from "../screens/customer/OrderTrackingScreen";
import OrderHistoryScreen from "../screens/customer/OrderHistoryScreen";
import OrderDetailsScreen from "../screens/customer/OrderDetailsScreen";
import RateOrderScreen from "../screens/customer/RateOrderScreen";
import ProfileScreen from "../screens/customer/ProfileScreen";
import AddressListScreen from "../screens/customer/AddressListScreen";
import AddAddressScreen from "../screens/customer/AddAddressScreen";
import EditAddressScreen from "../screens/customer/EditAddressScreen";
import PaymentMethodsScreen from "../screens/customer/PaymentMethodsScreen";
import PaymentResultScreen from "../screens/customer/PaymentResultScreen";
import SearchScreen from "../screens/customer/SearchScreen";
import CategoryListScreen from "../screens/customer/CategoryListScreen";
import NotificationsScreen from "../screens/customer/NotificationsScreen";
import FavoritesScreen from "../screens/customer/FavoritesScreen";
import EditProfileScreen from "../screens/customer/EditProfileScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home Stack Navigator
const HomeStack = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
          shadowColor: "transparent",
          elevation: 0,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: theme.typography.fontSize.lg,
        },
        cardStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Restaurant"
        component={RestaurantScreen}
        options={({ route }) => ({
          title: route.params?.name || "Restaurant",
          headerTransparent: true,
          headerTintColor: theme.colors.white,
        })}
      />
      <Stack.Screen
        name="MenuItem"
        component={MenuItemScreen}
        options={({ route }) => ({ title: route.params?.name || "Menu Item" })}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: "Search" }}
      />
      <Stack.Screen
        name="CategoryList"
        component={CategoryListScreen}
        options={({ route }) => ({
          title: route.params?.category || "Category",
        })}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: "Notifications" }}
      />
    </Stack.Navigator>
  );
};

// Orders Stack Navigator
const OrdersStack = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
          shadowColor: "transparent",
          elevation: 0,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: theme.typography.fontSize.lg,
        },
        cardStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen
        name="OrderHistory"
        component={OrderHistoryScreen}
        options={{ title: "My Orders" }}
      />
      <Stack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{ title: "Order Details" }}
      />
      <Stack.Screen
        name="OrderTracking"
        component={OrderTrackingScreen}
        options={{ title: "Track Order" }}
      />
      <Stack.Screen
        name="RateOrder"
        component={RateOrderScreen}
        options={{ title: "Rate Order" }}
      />
    </Stack.Navigator>
  );
};

// Cart Stack Navigator
const CartStack = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
          shadowColor: "transparent",
          elevation: 0,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: theme.typography.fontSize.lg,
        },
        cardStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen
        name="CartScreen"
        component={CartScreen}
        options={{ title: "Your Cart" }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: "Checkout" }}
      />
      <Stack.Screen
        name="AddAddress"
        component={AddAddressScreen}
        options={{ title: "Add Delivery Address" }}
      />
      <Stack.Screen
        name="OrderConfirmation"
        component={OrderConfirmationScreen}
        options={{
          title: "Order Placed",
          headerLeft: null,
        }}
      />
      <Stack.Screen
        name="PaymentResult"
        component={PaymentResultScreen}
        options={{
          title: "Payment Result",
          headerLeft: null,
        }}
      />
    </Stack.Navigator>
  );
};

// Profile Stack Navigator
const ProfileStack = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
          shadowColor: "transparent",
          elevation: 0,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: theme.typography.fontSize.lg,
        },
        cardStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ title: "My Profile" }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: "Edit Profile" }}
      />
      <Stack.Screen
        name="AddressList"
        component={AddressListScreen}
        options={{ title: "My Addresses" }}
      />
      <Stack.Screen
        name="AddAddress"
        component={AddAddressScreen}
        options={{ title: "Add Address" }}
      />
      <Stack.Screen
        name="EditAddress"
        component={EditAddressScreen}
        options={{ title: "Edit Address" }}
      />
      <Stack.Screen
        name="PaymentMethods"
        component={PaymentMethodsScreen}
        options={{ title: "Payment Methods" }}
      />
      <Stack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ title: "Favorites" }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: "Notifications" }}
      />
    </Stack.Navigator>
  );
};

// Helper to hide tab bar on certain screens
const getTabBarVisibility = (route) => {
  const routeName = getFocusedRouteNameFromRoute(route) ?? "HomeScreen";
  const hideOnScreens = [
    "Restaurant",
    "MenuItem",
    "Search",
    "Checkout",
    "OrderConfirmation",
    "OrderTracking",
    "PaymentResult",
  ];

  return hideOnScreens.includes(routeName) ? false : true;
};

// Main Tab Navigator
const CustomerTabNavigator = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.placeholder,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={({ route }) => ({
          tabBarVisible: getTabBarVisibility(route),
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
          tabBarStyle: {
            display: getTabBarVisibility(route) ? "flex" : "none",
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
            height: 60,
            paddingBottom: 10,
          },
        })}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="clipboard-list" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartStack}
        options={({ route }) => ({
          tabBarVisible: getTabBarVisibility(route),
          tabBarIcon: ({ color, size }) => (
            <Icon name="cart" color={color} size={size} />
          ),
          tabBarStyle: {
            display: getTabBarVisibility(route) ? "flex" : "none",
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
            height: 60,
            paddingBottom: 10,
          },
        })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default CustomerTabNavigator;
