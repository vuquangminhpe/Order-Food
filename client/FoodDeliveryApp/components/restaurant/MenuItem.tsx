import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../contexts/ThemeContext";

const MenuItem = ({ item, onPress, onAddToCart }: any) => {
  const { theme } = useTheme();

  // Default image if none provided
  const imageSource = item.image
    ? { uri: item.image }
    : require("../../assets/images/food-placeholder.webp");

  // Check if item is on discount
  const isDiscounted =
    item.discountedPrice && item.discountedPrice < item.price;

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
      <View style={styles.infoContainer}>
        <Text
          style={[styles.name, { color: theme.colors.text }]}
          numberOfLines={2}
        >
          {item.name}
        </Text>

        <Text
          style={[styles.description, { color: theme.colors.darkGray }]}
          numberOfLines={2}
        >
          {item.description || "No description available"}
        </Text>

        <View style={styles.priceContainer}>
          {isDiscounted ? (
            <View style={styles.discountContainer}>
              <Text
                style={[styles.discountPrice, { color: theme.colors.primary }]}
              >
                ${item.discountedPrice.toFixed(2)}
              </Text>
              <Text
                style={[styles.originalPrice, { color: theme.colors.darkGray }]}
              >
                ${item.price.toFixed(2)}
              </Text>
            </View>
          ) : (
            <Text style={[styles.price, { color: theme.colors.text }]}>
              ${item.price.toFixed(2)}
            </Text>
          )}
        </View>

        {!item.isAvailable && (
          <View
            style={[
              styles.unavailableBadge,
              { backgroundColor: "rgba(0,0,0,0.7)" },
            ]}
          >
            <Text
              style={[styles.unavailableText, { color: theme.colors.white }]}
            >
              Out of Stock
            </Text>
          </View>
        )}
      </View>

      <View style={styles.imageContainer}>
        <Image source={imageSource} style={styles.image} resizeMode="cover" />

        {item.isAvailable && onAddToCart && (
          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={(e) => {
              e.stopPropagation();
              onAddToCart();
            }}
          >
            <Icon name="plus" size={18} color={theme.colors.white} />
          </TouchableOpacity>
        )}

        {isDiscounted && (
          <View
            style={[
              styles.discountBadge,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text style={[styles.discountText, { color: theme.colors.white }]}>
              {Math.round(
                ((item.price - item.discountedPrice) / item.price) * 100
              )}
              % OFF
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
  },
  infoContainer: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  price: {
    fontSize: 15,
    fontWeight: "500",
  },
  discountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  discountPrice: {
    fontSize: 15,
    fontWeight: "500",
    marginRight: 6,
  },
  originalPrice: {
    fontSize: 13,
    textDecorationLine: "line-through",
  },
  imageContainer: {
    width: 100,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  addButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  unavailableBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  unavailableText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  discountText: {
    fontSize: 10,
    fontWeight: "bold",
  },
});

export default MenuItem;
