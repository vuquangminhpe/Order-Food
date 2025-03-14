import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const { width, height } = Dimensions.get("window");

// Onboarding slides data
const slides = [
  {
    id: "1",
    title: "Discover Restaurants",
    description:
      "Find the best restaurants near you with a wide variety of cuisines to choose from.",
    image: require("../assets/images/onboarding1.png"),
    icon: "map-search",
  },
  {
    id: "2",
    title: "Easy Ordering",
    description:
      "Order your favorite food with just a few taps. Customize your order exactly how you like it.",
    image: require("../assets/images/onboarding2.png"),
    icon: "food",
  },
  {
    id: "3",
    title: "Fast Delivery",
    description:
      "Track your delivery in real time. Get your food delivered to your doorstep quickly.",
    image: require("../assets/images/onboarding3.png"),
    icon: "bike-fast",
  },
];

const OnboardingScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  // Handle skip button press
  const handleSkip = () => {
    // In a real app, you would mark onboarding as completed
    // For now, just navigate to the main app
    markOnboardingComplete();
  };

  // Handle next button press
  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      // Last slide, mark onboarding as completed
      markOnboardingComplete();
    }
  };

  // Mark onboarding as completed and navigate to main app
  const markOnboardingComplete = async () => {
    // In a real app, you would save this to AsyncStorage or backend
    // For now, just navigate to the main app
    // Update user profile to set firstLogin to false
    try {
      // In a real app, call API to update user profile
      // For now, just navigate
      navigation.replace("Customer");
    } catch (error) {
      console.error("Error updating user profile:", error);
    }
  };

  // Render slide item
  const renderSlideItem = ({ item, index }) => {
    return (
      <View
        style={[
          styles.slide,
          { backgroundColor: theme.colors.background, width },
        ]}
      >
        <View style={styles.imageContainer}>
          <Image
            source={item.image}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <View style={styles.iconCircle}>
          <Icon name={item.icon} size={50} color={theme.colors.white} />
        </View>

        <Text style={[styles.title, { color: theme.colors.text }]}>
          {item.title}
        </Text>

        <Text style={[styles.description, { color: theme.colors.darkGray }]}>
          {item.description}
        </Text>
      </View>
    );
  };

  // Render pagination dots
  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              {
                backgroundColor:
                  index === currentIndex
                    ? theme.colors.primary
                    : theme.colors.gray,
                width: index === currentIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        backgroundColor={theme.colors.background}
        barStyle={theme.colors.statusBar}
      />

      {/* Skip button */}
      {currentIndex < slides.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text
            style={[styles.skipButtonText, { color: theme.colors.darkGray }]}
          >
            Skip
          </Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlideItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {/* Pagination dots */}
      {renderPagination()}

      {/* Bottom buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={handleNext}
        >
          <Text style={[styles.buttonText, { color: theme.colors.white }]}>
            {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
          </Text>
          <Icon
            name={currentIndex === slides.length - 1 ? "check" : "arrow-right"}
            size={20}
            color={theme.colors.white}
            style={styles.buttonIcon}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 100,
    padding: 10,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  imageContainer: {
    width: width * 0.8,
    height: height * 0.4,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FF5A5F",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 30,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 56,
    borderRadius: 28,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default OnboardingScreen;
