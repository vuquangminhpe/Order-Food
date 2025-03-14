import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../contexts/ThemeContext";

// Import restaurant owner screens
import DashboardScreen from "../screens/DashboardScreen";
import MenuManagementScreen from "../screens/MenuManagementScreen";
import AddEditMenuItemScreen from "../screens/AddEditMenuItemScreen";
import OrdersScreen from "../screens/OrdersScreen";
import OrderDetailsScreen from "../screens/OrderDetailsScreen";
import AnalyticsScreen from "../screens/AnalyticsScreen";
import RestaurantProfileScreen from "../screens/RestaurantProfileScreen";
import EditRestaurantProfileScreen from "../screens/EditRestaurantProfileScreen";
import ProfileScreen from "../screens/ProfileScreen";
import NotificationsScreen from "../screens/NotificationsScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Dashboard Stack Navigator
const DashboardStack = () => {
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
        name="DashboardScreen"
        component={DashboardScreen}
        options={{ title: "Dashboard" }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: "Notifications" }}
      />
    </Stack.Navigator>
  );
};

// Menu Stack Navigator
const MenuStack = () => {
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
        name="MenuManagement"
        component={MenuManagementScreen}
        options={{ title: "Menu Management" }}
      />
      <Stack.Screen
        name="AddMenuItem"
        component={AddEditMenuItemScreen}
        options={{ title: "Add Menu Item" }}
      />
      <Stack.Screen
        name="EditMenuItem"
        component={AddEditMenuItemScreen}
        options={{ title: "Edit Menu Item" }}
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
        name="OrdersScreen"
        component={OrdersScreen}
        options={{ title: "Orders" }}
      />
      <Stack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{ title: "Order Details" }}
      />
    </Stack.Navigator>
  );
};

// Analytics Stack Navigator
const AnalyticsStack = () => {
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
        name="AnalyticsScreen"
        component={AnalyticsScreen}
        options={{ title: "Analytics" }}
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
        name="RestaurantProfile"
        component={RestaurantProfileScreen}
        options={{ title: "Restaurant Profile" }}
      />
      <Stack.Screen
        name="EditRestaurantProfile"
        component={EditRestaurantProfileScreen}
        options={{ title: "Edit Restaurant" }}
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
  const routeName = getFocusedRouteNameFromRoute(route) ?? "DashboardScreen";
  const hideOnScreens = [
    "AddMenuItem",
    "EditMenuItem",
    "OrderDetails",
    "EditRestaurantProfile",
  ];

  return hideOnScreens.includes(routeName) ? false : true;
};

// Main Tab Navigator
const RestaurantOwnerTabNavigator = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
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
        name="Dashboard"
        component={DashboardStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Menu"
        component={MenuStack}
        options={({ route }) => ({
          tabBarIcon: ({ color, size }) => (
            <Icon name="food-variant" color={color} size={size} />
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
        options={({ route }) => ({
          tabBarIcon: ({ color, size }) => (
            <Icon name="receipt" color={color} size={size} />
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
        name="Analytics"
        component={AnalyticsStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="chart-bar" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="RestaurantProfile"
        component={ProfileStack}
        options={({ route }) => ({
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Icon name="store" color={color} size={size} />
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

export default RestaurantOwnerTabNavigator;
