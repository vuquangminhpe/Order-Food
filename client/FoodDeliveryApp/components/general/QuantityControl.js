import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../contexts/ThemeContext";

const QuantityControl = ({
  quantity,
  onDecrease,
  onIncrease,
  min = 1,
  max = 99,
  size = "medium",
}) => {
  const { theme } = useTheme();

  // Determine button and text size based on size prop
  const buttonSize = size === "small" ? 28 : size === "medium" ? 36 : 44;
  const fontSize = size === "small" ? 14 : size === "medium" ? 16 : 18;
  const iconSize = size === "small" ? 16 : size === "medium" ? 20 : 24;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            width: buttonSize,
            height: buttonSize,
            backgroundColor: theme.colors.gray,
            opacity: quantity <= min ? 0.5 : 1,
          },
        ]}
        onPress={onDecrease}
        disabled={quantity <= min}
      >
        <Icon name="minus" size={iconSize} color={theme.colors.text} />
      </TouchableOpacity>

      <Text
        style={[
          styles.quantityText,
          {
            color: theme.colors.text,
            fontSize: fontSize,
            marginHorizontal: size === "small" ? 8 : 12,
          },
        ]}
      >
        {quantity}
      </Text>

      <TouchableOpacity
        style={[
          styles.button,
          {
            width: buttonSize,
            height: buttonSize,
            backgroundColor: theme.colors.gray,
            opacity: quantity >= max ? 0.5 : 1,
          },
        ]}
        onPress={onIncrease}
        disabled={quantity >= max}
      >
        <Icon name="plus" size={iconSize} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  button: {
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontWeight: "bold",
  },
});

export default QuantityControl;
