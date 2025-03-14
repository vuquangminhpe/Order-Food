import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../contexts/ThemeContext";

// Import delivery person screens
import DeliveryHomeScreen from "../screens/deliveryPerson/DeliveryHomeScreen";
import DeliveryMapScreen from "../screens/deliveryPerson/DeliveryMapScreen";
import DeliveryOrderDetailsScreen from "../screens/deliveryPerson/DeliveryOrderDetailsScreen";
import DeliveryHistoryScreen from "../screens/deliveryPerson/DeliveryHistoryScreen";
import DeliveryEarningsScreen from "../screens/deliveryPerson/DeliveryEarningsScreen";
import DeliveryProfileScreen from "../screens/deliveryPerson/DeliveryProfileScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import ProfileScreen from "../screens/ProfileScreen";

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
        name="DeliveryHomeScreen"
        component={DeliveryHomeScreen}
        options={{ title: "Available Orders" }}
      />
      <Stack.Screen
        name="DeliveryOrderDetails"
        component={DeliveryOrderDetailsScreen}
        options={{ title: "Order Details" }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: "Notifications" }}
      />
    </Stack.Navigator>
  );
};

// Map Stack Navigator
const MapStack = () => {
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
        name="DeliveryMapScreen"
        component={DeliveryMapScreen}
        options={{ title: "Delivery Map" }}
      />
      <Stack.Screen
        name="DeliveryOrderDetails"
        component={DeliveryOrderDetailsScreen}
        options={{ title: "Order Details" }}
      />
    </Stack.Navigator>
  );
};

// History Stack Navigator
const HistoryStack = () => {
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
        name="DeliveryHistoryScreen"
        component={DeliveryHistoryScreen}
        options={{ title: "Delivery History" }}
      />
      <Stack.Screen
        name="DeliveryOrderDetails"
        component={DeliveryOrderDetailsScreen}
        options={{ title: "Order Details" }}
      />
    </Stack.Navigator>
  );
};

// Earnings Stack Navigator
const EarningsStack = () => {
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
        name="DeliveryEarningsScreen"
        component={DeliveryEarningsScreen}
        options={{ title: "Earnings" }}
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
        name="DeliveryProfileScreen"
        component={DeliveryProfileScreen}
        options={{ title: "Delivery Profile" }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "My Profile" }}
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
  const routeName = getFocusedRouteNameFromRoute(route) ?? "DeliveryHomeScreen";
  const hideOnScreens = ["DeliveryOrderDetails"];

  return hideOnScreens.includes(routeName) ? false : true;
};

// Main Tab Navigator
const DeliveryPersonTabNavigator = () => {
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
        name="Map"
        component={MapStack}
        options={({ route }) => ({
          tabBarIcon: ({ color, size }) => (
            <Icon name="map" color={color} size={size} />
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
        name="History"
        component={HistoryStack}
        options={({ route }) => ({
          tabBarIcon: ({ color, size }) => (
            <Icon name="history" color={color} size={size} />
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
        name="Earnings"
        component={EarningsStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="cash" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={({ route }) => ({
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" color={color} size={size} />
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
    </Tab.Navigator>
  );
};

export default DeliveryPersonTabNavigator;
