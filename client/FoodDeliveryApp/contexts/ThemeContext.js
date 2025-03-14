import React, { createContext, useState, useEffect, useContext } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define the light theme
export const lightTheme = {
  mode: "light",
  colors: {
    primary: "#FF5A5F", // Airbnb-like red
    secondary: "#00A699", // Teal accent
    background: "#FFFFFF",
    card: "#FFFFFF",
    text: "#2F455C", // Dark blue text
    border: "#E1E8ED",
    notification: "#FF3B30",
    placeholder: "#A0AEC0",
    backdrop: "rgba(0, 0, 0, 0.5)",
    error: "#E53E3E",
    success: "#38A169",
    warning: "#F6AD55",
    info: "#4299E1",

    // Additional colors
    accent: "#FF9500",
    highlight: "#FFECF0",
    gray: "#F7FAFC",
    darkGray: "#718096",
    black: "#1A202C",
    white: "#FFFFFF",

    // UI specific
    statusBar: "dark-content",
    tabBar: "#FFFFFF",
    tabBarInactive: "#A0AEC0",
    tabBarActive: "#FF5A5F",
    cardShadow: "rgba(0, 0, 0, 0.05)",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  typography: {
    fontFamily: {
      regular: "System",
      medium: "System",
      bold: "System",
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 30,
    },
    lineHeight: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 28,
      xl: 32,
      xxl: 36,
      xxxl: 40,
    },
  },
  shadow: {
    sm: {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.15,
      shadowRadius: 3.84,
      elevation: 3,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.2,
      shadowRadius: 5.46,
      elevation: 5,
    },
  },
};

// Define the dark theme
export const darkTheme = {
  mode: "dark",
  colors: {
    primary: "#FF5A5F",
    secondary: "#00A699",
    background: "#1A202C",
    card: "#2D3748",
    text: "#F7FAFC",
    border: "#4A5568",
    notification: "#FF453A",
    placeholder: "#718096",
    backdrop: "rgba(0, 0, 0, 0.8)",
    error: "#FEB2B2",
    success: "#9AE6B4",
    warning: "#FEEBC8",
    info: "#BEE3F8",

    // Additional colors
    accent: "#FFB74D",
    highlight: "#553C3E",
    gray: "#2D3748",
    darkGray: "#A0AEC0",
    black: "#FFFFFF",
    white: "#1A202C",

    // UI specific
    statusBar: "light-content",
    tabBar: "#171923",
    tabBarInactive: "#718096",
    tabBarActive: "#FF5A5F",
    cardShadow: "rgba(0, 0, 0, 0.2)",
  },
  // Keep the same spacing, borderRadius, typography, and shadow as light theme
  spacing: lightTheme.spacing,
  borderRadius: lightTheme.borderRadius,
  typography: lightTheme.typography,
  shadow: lightTheme.shadow,
};

export const ThemeContext = createContext({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
  setDarkMode: () => {},
  setLightMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const colorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState("system"); // 'light', 'dark', or 'system'

  // Initialize theme based on saved preference or system default
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem("themeMode");
        if (savedThemeMode) {
          setThemeMode(savedThemeMode);
        }
      } catch (error) {
        console.error("Error loading theme preference:", error);
      }
    };

    loadThemePreference();
  }, []);

  // Save theme preference when it changes
  useEffect(() => {
    const saveThemePreference = async () => {
      try {
        await AsyncStorage.setItem("themeMode", themeMode);
      } catch (error) {
        console.error("Error saving theme preference:", error);
      }
    };

    saveThemePreference();
  }, [themeMode]);

  // Determine if dark mode should be used
  const isDark =
    themeMode === "dark" || (themeMode === "system" && colorScheme === "dark");

  // Get the appropriate theme
  const theme = isDark ? darkTheme : lightTheme;

  // Toggle between light and dark mode
  const toggleTheme = () => {
    setThemeMode(isDark ? "light" : "dark");
  };

  // Set specific theme modes
  const setDarkMode = () => setThemeMode("dark");
  const setLightMode = () => setThemeMode("light");
  const setSystemMode = () => setThemeMode("system");

  const value = {
    theme,
    isDark,
    toggleTheme,
    setDarkMode,
    setLightMode,
    setSystemMode,
    themeMode,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
