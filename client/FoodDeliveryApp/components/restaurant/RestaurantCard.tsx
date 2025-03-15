import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../contexts/ThemeContext";
import RatingStars from "../general/RatingStars";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.7;

const RestaurantCard = ({ restaurant, onPress, horizontal = true }: any) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        horizontal ? styles.horizontalCard : styles.verticalCard,
        {
          backgroundColor: theme.colors.card,
          ...theme.shadow.md,
        },
      ]}
      onPress={() => onPress(restaurant)}
      activeOpacity={0.8}
    >
      {/* Restaurant Image */}
      <View
        style={
          horizontal
            ? styles.horizontalImageContainer
            : styles.verticalImageContainer
        }
      >
        <Image
          source={{
            uri:
              restaurant.coverImage ||
              restaurant.logoImage ||
              "https://via.placeholder.com/400x200?text=Restaurant",
          }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Delivery Time Badge */}
        <View
          style={[
            styles.deliveryBadge,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <Icon name="clock-outline" size={12} color={theme.colors.white} />
          <Text style={[styles.deliveryText, { color: theme.colors.white }]}>
            {restaurant.estimatedDeliveryTime || 30}-
            {(restaurant.estimatedDeliveryTime || 30) + 10} min
          </Text>
        </View>
      </View>

      {/* Restaurant Info */}
      <View style={styles.infoContainer}>
        <Text
          style={[styles.name, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {restaurant.name}
        </Text>

        {/* Categories */}
        <Text
          style={[styles.categories, { color: theme.colors.darkGray }]}
          numberOfLines={1}
        >
          {Array.isArray(restaurant.categories)
            ? restaurant.categories.join(" • ")
            : "Restaurant"}
        </Text>

        {/* Rating & Price */}
        <View style={styles.ratingRow}>
          <View style={styles.ratingContainer}>
            <RatingStars rating={restaurant.rating || 0} size={12} />
            <Text style={[styles.ratingText, { color: theme.colors.darkGray }]}>
              {restaurant.rating?.toFixed(1) || "0.0"} (
              {restaurant.totalRatings || 0})
            </Text>
          </View>

          <View style={styles.priceContainer}>
            <Text
              style={[styles.deliveryFee, { color: theme.colors.darkGray }]}
            >
              {restaurant.deliveryFee
                ? `$${restaurant.deliveryFee.toFixed(2)} delivery`
                : "Free delivery"}
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
    marginBottom: 16,
  },
  horizontalCard: {
    width: CARD_WIDTH,
    marginRight: 16,
  },
  verticalCard: {
    width: "100%",
  },
  horizontalImageContainer: {
    height: 150,
  },
  verticalImageContainer: {
    height: 180,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  deliveryBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
  categories: {
    fontSize: 12,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  deliveryFee: {
    fontSize: 12,
  },
});

export default RestaurantCard;
