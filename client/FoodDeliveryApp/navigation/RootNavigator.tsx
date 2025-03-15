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

// Splash Screen
import SplashScreen from "../screens/SplashScreen";
import OnboardingScreen from "@/screens/OnboardingScreen";

const Stack = createStackNavigator();

const RootNavigator = () => {
  const { user, initialized, loading, hasRole, USER_ROLES } = useAuth();
  const { theme } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={theme.colors.statusBar as any}
        backgroundColor={theme.colors.background}
        translucent={false}
      />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Loading screen */}
        {!initialized || loading ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : !user ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (user as any).firstLogin ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : hasRole(USER_ROLES.RESTAURANT_OWNER) ? (
          <Stack.Screen
            name="RestaurantOwner"
            component={RestaurantOwnerTabNavigator}
          />
        ) : hasRole(USER_ROLES.DELIVERY_PERSON) ? (
          <Stack.Screen
            name="DeliveryPerson"
            component={DeliveryPersonTabNavigator}
          />
        ) : (
          <Stack.Screen name="Customer" component={CustomerTabNavigator} />
        )}
      </Stack.Navigator>
    </>
  );
};

export default RootNavigator;
