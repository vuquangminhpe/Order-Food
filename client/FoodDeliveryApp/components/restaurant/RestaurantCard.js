import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../contexts/ThemeContext";
import RatingStars from "../general/RatingStars";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.7;

const RestaurantCard = ({ restaurant, onPress, horizontal = true }) => {
  const { theme } = useTheme();

  // Default image if none provided
  const imageSource =
    restaurant.coverImage || restaurant.logoImage
      ? { uri: restaurant.coverImage || restaurant.logoImage }
      : require("../../assets/images/restaurant-placeholder.jpg");

  return (
    <TouchableOpacity
      style={[
        styles.container,
        horizontal ? styles.horizontalCard : styles.verticalCard,
        {
          backgroundColor: theme.colors.background,
          ...theme.shadow.md,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image source={imageSource} style={styles.image} resizeMode="cover" />

      {/* Delivery time badge */}
      <View
        style={[
          styles.deliveryBadge,
          { backgroundColor: theme.colors.primary },
        ]}
      >
        <Icon name="clock-outline" size={12} color={theme.colors.white} />
        <Text style={[styles.deliveryText, { color: theme.colors.white }]}>
          {restaurant.estimatedDeliveryTime || 30} min
        </Text>
      </View>

      {/* Restaurant Info */}
      <View style={styles.infoContainer}>
        <Text
          style={[styles.name, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {restaurant.name}
        </Text>

        <View style={styles.ratingContainer}>
          <RatingStars rating={restaurant.rating || 0} size={14} />
          <Text style={[styles.ratingText, { color: theme.colors.darkGray }]}>
            ({restaurant.totalRatings || 0})
          </Text>
        </View>

        <View style={styles.categoryContainer}>
          {restaurant.categories &&
            restaurant.categories.slice(0, 2).map((category, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <Text style={[styles.dot, { color: theme.colors.darkGray }]}>
                    •
                  </Text>
                )}
                <Text
                  style={[styles.category, { color: theme.colors.darkGray }]}
                >
                  {category}
                </Text>
              </React.Fragment>
            ))}
        </View>

        <View style={styles.deliveryInfoContainer}>
          <View style={styles.deliveryInfo}>
            <Icon name="bike-fast" size={14} color={theme.colors.darkGray} />
            <Text
              style={[styles.deliveryFee, { color: theme.colors.darkGray }]}
            >
              ${restaurant.deliveryFee?.toFixed(2) || "0.00"} delivery
            </Text>
          </View>

          <View style={styles.minOrder}>
            <Text
              style={[styles.minOrderText, { color: theme.colors.darkGray }]}
            >
              ${restaurant.minOrderAmount?.toFixed(2) || "0.00"} min
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 16,
    marginBottom: 16,
  },
  horizontalCard: {
    width: CARD_WIDTH,
  },
  verticalCard: {
    width: "100%",
  },
  image: {
    width: "100%",
    height: 140,
  },
  deliveryBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  deliveryText: {
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 4,
  },
  infoContainer: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  category: {
    fontSize: 12,
  },
  dot: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  deliveryInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deliveryInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  deliveryFee: {
    fontSize: 12,
    marginLeft: 4,
  },
  minOrder: {},
  minOrderText: {
    fontSize: 12,
  },
});

export default RestaurantCard;
