import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  StatusBar,
  Animated,
  Easing,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";

const SplashScreen = () => {
  const { theme } = useTheme();
  const logoOpacity = new Animated.Value(0);
  const logoScale = new Animated.Value(0.5);
  const textOpacity = new Animated.Value(0);

  useEffect(() => {
    // Animate logo fading in and scaling up
    Animated.sequence([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.elastic(1),
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
    ]).start();
  }, []);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        backgroundColor={theme.colors.background}
        barStyle={theme.colors.statusBar}
      />

      <View style={styles.contentContainer}>
        <Animated.Image
          source={require("../assets/images/logo.png")}
          style={[
            styles.logo,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
          resizeMode="contain"
        />

        <Animated.Text
          style={[
            styles.appName,
            { color: theme.colors.primary, opacity: textOpacity },
          ]}
        >
          Food Delivery
        </Animated.Text>

        <Animated.Text
          style={[
            styles.tagline,
            { color: theme.colors.darkGray, opacity: textOpacity },
          ]}
        >
          Delicious food at your doorstep
        </Animated.Text>
      </View>

      <ActivityIndicator
        size="large"
        color={theme.colors.primary}
        style={styles.loader}
      />

      <Text style={[styles.footerText, { color: theme.colors.darkGray }]}>
        © 2023 Food Delivery
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    alignItems: "center",
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
  footerText: {
    position: "absolute",
    bottom: 24,
    fontSize: 12,
  },
});

export default SplashScreen;
