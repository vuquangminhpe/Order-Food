import React from "react";
import { View, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";

const RatingStars = ({
  rating,
  size = 16,
  maxStars = 5,
  starColor,
  emptyStarColor,
  halfStarThreshold = 0.5,
}: any) => {
  const { theme } = useTheme();

  // Use provided colors or defaults from theme
  const filledColor = starColor || theme.colors.primary;
  const emptyColor = emptyStarColor || theme.colors.gray;

  // Create an array of star components based on rating
  const stars = [];
  const roundedRating = Math.round(rating * 2) / 2; // Round to nearest 0.5

  for (let i = 1; i <= maxStars; i++) {
    if (i <= roundedRating) {
      // Full star
      stars.push(
        <MaterialCommunityIcons
          key={i}
          name="star"
          size={size}
          color={filledColor}
          style={styles.star}
        />
      );
    } else if (
      i - roundedRating <= halfStarThreshold &&
      i - roundedRating > 0
    ) {
      // Half star
      stars.push(
        <MaterialCommunityIcons
          key={i}
          name="star-half-full"
          size={size}
          color={filledColor}
          style={styles.star}
        />
      );
    } else {
      // Empty star
      stars.push(
        <MaterialCommunityIcons
          key={i}
          name="star-outline"
          size={size}
          color={emptyColor}
          style={styles.star}
        />
      );
    }
  }

  return <View style={styles.container}>{stars}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  star: {
    marginRight: 2,
  },
});

export default RatingStars;
