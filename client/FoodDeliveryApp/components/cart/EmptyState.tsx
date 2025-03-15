import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../contexts/ThemeContext";

const EmptyState = ({
  icon,
  title,
  description,
  buttonText,
  onButtonPress,
  iconSize = 80,
}: any) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Icon name={icon} size={iconSize} color={theme.colors.darkGray} />

      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>

      <Text style={[styles.description, { color: theme.colors.darkGray }]}>
        {description}
      </Text>

      {buttonText && onButtonPress && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={onButtonPress}
        >
          <Text style={[styles.buttonText, { color: theme.colors.white }]}>
            {buttonText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
  },
});

export default EmptyState;
