import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../contexts/ThemeContext";
import RatingStars from "../general/RatingStars";

const RestaurantListItem = ({
  restaurant,
  onPress,
  onFavoritePress,
  isFavorite,
}: any) => {
  const { theme } = useTheme();

  // Default image if none provided
  const imageSource =
    restaurant.image || restaurant.coverImage || restaurant.logoImage
      ? {
          uri:
            restaurant.image || restaurant.coverImage || restaurant.logoImage,
        }
      : require("../../assets/images/restaurant-placeholder.webp");

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image source={imageSource} style={styles.image} resizeMode="cover" />

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
            restaurant.categories
              .slice(0, 2)
              .map((category: any, index: any) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <Text
                      style={[styles.dot, { color: theme.colors.darkGray }]}
                    >
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
            <Icon
              name="clock-outline"
              size={14}
              color={theme.colors.darkGray}
            />
            <Text
              style={[styles.deliveryTime, { color: theme.colors.darkGray }]}
            >
              {restaurant.deliveryTime ||
                restaurant.estimatedDeliveryTime + " min" ||
                "30-45 min"}
            </Text>
          </View>

          <View style={styles.deliveryFeeContainer}>
            <Icon name="bike-fast" size={14} color={theme.colors.darkGray} />
            <Text
              style={[styles.deliveryFee, { color: theme.colors.darkGray }]}
            >
              ${restaurant.deliveryFee?.toFixed(2) || "0.00"}
            </Text>
          </View>
        </View>
      </View>

      {onFavoritePress && (
        <TouchableOpacity
          style={[
            styles.favoriteButton,
            { backgroundColor: theme.colors.background },
          ]}
          onPress={onFavoritePress}
        >
          <Icon
            name={isFavorite ? "heart" : "heart-outline"}
            size={22}
            color={isFavorite ? theme.colors.primary : theme.colors.darkGray}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  image: {
    width: 100,
    height: 100,
  },
  infoContainer: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
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
    marginTop: 4,
  },
  deliveryInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  deliveryTime: {
    fontSize: 12,
    marginLeft: 4,
  },
  deliveryFeeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  deliveryFee: {
    fontSize: 12,
    marginLeft: 4,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
});

export default RestaurantListItem;
