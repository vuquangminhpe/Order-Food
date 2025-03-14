import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../contexts/ThemeContext";

const CartItem = ({ item, onUpdateQuantity, onRemove, onPress }) => {
  const { theme } = useTheme();

  // Format options text for display
  const getOptionsText = () => {
    if (!item.options || item.options.length === 0) {
      return "";
    }

    return item.options
      .map((option) => {
        const itemNames = option.items.map((item) => item.name).join(", ");
        return `${option.title}: ${itemNames}`;
      })
      .join(" | ");
  };

  return (
    <TouchableOpacity
      style={[styles.container, { borderBottomColor: theme.colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Item Info */}
      <View style={styles.infoContainer}>
        <View style={styles.mainInfo}>
          <Text
            style={[styles.name, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>

          {item.options && item.options.length > 0 && (
            <Text
              style={[styles.options, { color: theme.colors.darkGray }]}
              numberOfLines={2}
            >
              {getOptionsText()}
            </Text>
          )}
        </View>

        <Text style={[styles.price, { color: theme.colors.text }]}>
          ${item.totalPrice.toFixed(2)}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.removeButton, { borderColor: theme.colors.border }]}
          onPress={onRemove}
        >
          <Icon name="trash-can-outline" size={16} color={theme.colors.error} />
        </TouchableOpacity>

        <View
          style={[
            styles.quantityContainer,
            { backgroundColor: theme.colors.gray },
          ]}
        >
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => onUpdateQuantity(item.quantity - 1)}
          >
            <Icon name="minus" size={16} color={theme.colors.text} />
          </TouchableOpacity>

          <View style={styles.quantityValueContainer}>
            <Text style={[styles.quantityValue, { color: theme.colors.text }]}>
              {item.quantity}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => onUpdateQuantity(item.quantity + 1)}
          >
            <Icon name="plus" size={16} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  mainInfo: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  options: {
    fontSize: 12,
  },
  price: {
    fontSize: 16,
    fontWeight: "500",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    overflow: "hidden",
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityValueContainer: {
    paddingHorizontal: 8,
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default CartItem;
