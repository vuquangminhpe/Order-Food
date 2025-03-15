import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../contexts/ThemeContext";

const CategoryCard = ({ title, icon, isActive = false, onPress }: any) => {
  const { theme } = useTheme();

  const backgroundColor = isActive ? theme.colors.primary : theme.colors.gray;

  const textColor = isActive ? theme.colors.white : theme.colors.text;

  const iconColor = isActive ? theme.colors.white : theme.colors.primary;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isActive
              ? "rgba(255,255,255,0.2)"
              : "rgba(255,90,95,0.1)",
          },
        ]}
      >
        <Icon name={icon} size={24} color={iconColor} />
      </View>

      <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 12,
    width: 80,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default CategoryCard;
