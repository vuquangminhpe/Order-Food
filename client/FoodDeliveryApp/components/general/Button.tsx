import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";

const Button = ({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  variant = "filled", // filled, outlined, text
  size = "medium", // small, medium, large
  width = "auto", // auto, full
  iconSize,
  upperCase = false,
  ...props
}: any) => {
  const { theme } = useTheme();

  // Determine button colors based on variant and disabled state
  const getButtonStyles = () => {
    if (disabled) {
      return {
        backgroundColor:
          variant === "filled" ? theme.colors.gray : "transparent",
        borderColor: variant === "outlined" ? theme.colors.gray : "transparent",
        borderWidth: variant === "outlined" ? 1 : 0,
      };
    }

    switch (variant) {
      case "outlined":
        return {
          backgroundColor: "transparent",
          borderColor: theme.colors.primary,
          borderWidth: 1,
        };
      case "text":
        return {
          backgroundColor: "transparent",
          borderWidth: 0,
        };
      case "filled":
      default:
        return {
          backgroundColor: theme.colors.primary,
          borderWidth: 0,
        };
    }
  };

  // Determine text color based on variant and disabled state
  const getTextColor = () => {
    if (disabled) {
      return theme.colors.darkGray;
    }

    return variant === "filled" ? theme.colors.white : theme.colors.primary;
  };

  // Determine button padding based on size
  const getPadding = () => {
    switch (size) {
      case "small":
        return { paddingVertical: 8, paddingHorizontal: 16 };
      case "large":
        return { paddingVertical: 16, paddingHorizontal: 32 };
      case "medium":
      default:
        return { paddingVertical: 12, paddingHorizontal: 24 };
    }
  };

  // Determine icon size based on button size or provided iconSize
  const getIconSize = () => {
    if (iconSize) return iconSize;

    switch (size) {
      case "small":
        return 16;
      case "large":
        return 24;
      case "medium":
      default:
        return 20;
    }
  };

  // Determine width
  const getWidth = () => {
    return width === "full" ? { width: "100%" } : {};
  };

  // Get combined button styles
  const buttonStyles = [
    styles.button,
    getButtonStyles(),
    getPadding(),
    getWidth(),
    style,
  ];

  // Get text styles
  const textStyles = [
    styles.text,
    { color: getTextColor() },
    size === "small" && { fontSize: 14 },
    size === "large" && { fontSize: 18 },
    upperCase && { textTransform: "uppercase" },
    textStyle,
  ];

  const iconColor = getTextColor();
  const iconDimension = getIconSize();

  // Render the button content
  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator color={getTextColor()} size="small" />;
    }

    return (
      <>
        {icon && iconPosition === "left" && (
          <MaterialCommunityIcons
            name={icon}
            size={iconDimension}
            color={iconColor}
            style={styles.leftIcon}
          />
        )}
        <Text style={textStyles}>{title}</Text>
        {icon && iconPosition === "right" && (
          <MaterialCommunityIcons
            name={icon}
            size={iconDimension}
            color={iconColor}
            style={styles.rightIcon}
          />
        )}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  text: {
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});

export default Button;
