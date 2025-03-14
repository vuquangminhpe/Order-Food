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

const RestaurantCard = ({
  restaurant,
  onPress,
  onFavoritePress,
  isFavorite,
}) => {
  const { theme } = useTheme();

  const handleFavoritePress = (e) => {
    e.stopPropagation();
    if (onFavoritePress) {
      onFavoritePress(restaurant._id);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.card }]}
      onPress={() => onPress(restaurant)}
      activeOpacity={0.8}
    >
      {/* Cover Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: restaurant.coverImage || "https://via.placeholder.com/400x200",
          }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Favorite Button */}
        {onFavoritePress && (
          <TouchableOpacity
            style={[
              styles.favoriteButton,
              { backgroundColor: theme.colors.white },
            ]}
            onPress={handleFavoritePress}
          >
            <Icon
              name={isFavorite ? "heart" : "heart-outline"}
              size={18}
              color={isFavorite ? theme.colors.primary : theme.colors.darkGray}
            />
          </TouchableOpacity>
        )}

        {/* Delivery Time Pill */}
        {restaurant.estimatedDeliveryTime && (
          <View
            style={[
              styles.deliveryTimePill,
              { backgroundColor: theme.colors.white },
            ]}
          >
            <Icon
              name="clock-outline"
              size={12}
              color={theme.colors.darkGray}
            />
            <Text
              style={[styles.deliveryTimeText, { color: theme.colors.text }]}
            >
              {restaurant.estimatedDeliveryTime}-
              {restaurant.estimatedDeliveryTime + 10} min
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <Text
          style={[styles.name, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {restaurant.name}
        </Text>

        {/* Rating */}
        <View style={styles.ratingContainer}>
          <RatingStars rating={restaurant.rating || 0} size={14} />
          <Text style={[styles.ratingText, { color: theme.colors.darkGray }]}>
            ({restaurant.totalRatings || 0})
          </Text>
        </View>

        {/* Categories */}
        {restaurant.categories && restaurant.categories.length > 0 && (
          <Text
            style={[styles.categories, { color: theme.colors.darkGray }]}
            numberOfLines={1}
          >
            {restaurant.categories.join(" • ")}
          </Text>
        )}

        {/* Delivery Info */}
        <View style={styles.deliveryInfoContainer}>
          {restaurant.deliveryFee !== undefined && (
            <View style={styles.deliveryInfoItem}>
              <Icon name="cash" size={14} color={theme.colors.darkGray} />
              <Text
                style={[
                  styles.deliveryInfoText,
                  { color: theme.colors.darkGray },
                ]}
              >
                ${restaurant.deliveryFee.toFixed(2)} delivery
              </Text>
            </View>
          )}

          {restaurant.distance !== undefined && (
            <View style={styles.deliveryInfoItem}>
              <Icon name="map-marker" size={14} color={theme.colors.darkGray} />
              <Text
                style={[
                  styles.deliveryInfoText,
                  { color: theme.colors.darkGray },
                ]}
              >
                {restaurant.distance.toFixed(1)} km
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    borderRadius: 12,
    marginRight: 16,
    marginBottom: 8,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  imageContainer: {
    height: 150,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  deliveryTimePill: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  deliveryTimeText: {
    fontSize: 10,
    fontWeight: "500",
    marginLeft: 4,
  },
  contentContainer: {
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
  categories: {
    fontSize: 12,
    marginBottom: 8,
  },
  deliveryInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  deliveryInfoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  deliveryInfoText: {
    fontSize: 12,
    marginLeft: 4,
  },
});

export default RestaurantCard;
