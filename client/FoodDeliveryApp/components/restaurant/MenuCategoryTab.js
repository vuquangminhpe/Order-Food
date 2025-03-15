import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

const MenuCategoryTab = ({ title, isActive, onPress }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          borderBottomColor: isActive ? theme.colors.primary : "transparent",
          backgroundColor: isActive ? theme.colors.highlight : "transparent",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.title,
          {
            color: isActive ? theme.colors.primary : theme.colors.darkGray,
            fontWeight: isActive ? "bold" : "normal",
          },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 48,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 2,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
  },
});

export default MenuCategoryTab;
