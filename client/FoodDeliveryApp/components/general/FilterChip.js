import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../contexts/ThemeContext";

const FilterChip = ({
  label,
  selected = false,
  onPress,
  icon,
  iconPosition = "left",
  withCloseButton = false,
  onClose,
  disabled = false,
}) => {
  const { theme } = useTheme();

  const backgroundColor = selected ? theme.colors.primary : theme.colors.gray;

  const textColor = selected ? theme.colors.white : theme.colors.text;

  const borderColor = selected ? theme.colors.primary : theme.colors.border;

  const handleClose = (e) => {
    e.stopPropagation();
    if (onClose) {
      onClose();
    }
  };

  const renderIcon = () => {
    if (!icon) return null;

    return (
      <Icon
        name={icon}
        size={16}
        color={textColor}
        style={iconPosition === "left" ? styles.iconLeft : styles.iconRight}
      />
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor, borderColor },
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      {icon && iconPosition === "left" && renderIcon()}

      <Text style={[styles.label, { color: textColor }]}>{label}</Text>

      {icon && iconPosition === "right" && renderIcon()}

      {withCloseButton && selected && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Icon name="close-circle" size={16} color={theme.colors.white} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  iconLeft: {
    marginRight: 6,
  },
  iconRight: {
    marginLeft: 6,
  },
  closeButton: {
    marginLeft: 6,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default FilterChip;
