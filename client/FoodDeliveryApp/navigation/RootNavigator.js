import React, { useEffect } from "react";
import { StatusBar } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

// Auth Screens
import AuthNavigator from "./AuthNavigator";

// Customer Screens
import CustomerTabNavigator from "./CustomerTabNavigator";

// Restaurant Owner Screens
import RestaurantOwnerTabNavigator from "./RestaurantOwnerTabNavigator";

// Delivery Person Screens
import DeliveryPersonTabNavigator from "./DeliveryPersonTabNavigator";

// Onboarding Screen
import OnboardingScreen from "../screens/OnboardingScreen";

// Splash Screen
import SplashScreen from "../screens/SplashScreen";

const Stack = createStackNavigator();

const RootNavigator = () => {
  const { user, initialized, loading, hasRole, USER_ROLES } = useAuth();
  const { theme } = useTheme();

  // Determine which navigator to show based on user role and authentication status
  const renderNavigator = () => {
    if (!initialized || loading) {
      return (
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
      );
    }

    if (!user) {
      return (
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{ headerShown: false }}
        />
      );
    }

    // First time user - show onboarding
    if (user.firstLogin) {
      return (
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
      );
    }

    // Based on user role, show the appropriate navigator
    if (hasRole(USER_ROLES.RESTAURANT_OWNER)) {
      return (
        <Stack.Screen
          name="RestaurantOwner"
          component={RestaurantOwnerTabNavigator}
          options={{ headerShown: false }}
        />
      );
    } else if (hasRole(USER_ROLES.DELIVERY_PERSON)) {
      return (
        <Stack.Screen
          name="DeliveryPerson"
          component={DeliveryPersonTabNavigator}
          options={{ headerShown: false }}
        />
      );
    } else {
      // Default to customer navigator
      return (
        <Stack.Screen
          name="Customer"
          component={CustomerTabNavigator}
          options={{ headerShown: false }}
        />
      );
    }
  };

  return (
    <>
      <StatusBar
        barStyle={theme.colors.statusBar}
        backgroundColor={theme.colors.background}
        translucent={false}
      />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {renderNavigator()}
      </Stack.Navigator>
    </>
  );
};

export default RootNavigator;
