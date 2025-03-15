import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import FlashMessage from "react-native-flash-message";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import RootNavigator from "./navigation/RootNavigator";
import { SocketProvider } from "./contexts/SocketContext";
import { LocationProvider } from "./contexts/LocationContext";

const App = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <LocationProvider>
            <SocketProvider>
              <CartProvider>
                <NavigationContainer>
                  <RootNavigator />
                  <FlashMessage position="top" />
                </NavigationContainer>
              </CartProvider>
            </SocketProvider>
          </LocationProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
