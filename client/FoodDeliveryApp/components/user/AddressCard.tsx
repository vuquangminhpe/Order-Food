import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../contexts/ThemeContext";

const AddressCard = ({
  address,
  selected = false,
  onPress,
  onEdit,
  onDelete,
  showEditButton = true,
  showDeleteButton = true,
}: any) => {
  const { theme } = useTheme();

  // Handle edit button press
  const handleEdit = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(address);
    }
  };

  // Handle delete button press
  const handleDelete = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(address);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: selected
            ? theme.colors.highlight
            : theme.colors.background,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      {/* Address icon and default badge */}
      <View style={styles.iconContainer}>
        <View
          style={[styles.iconCircle, { backgroundColor: theme.colors.gray }]}
        >
          <Icon
            name="map-marker"
            size={20}
            color={selected ? theme.colors.primary : theme.colors.text}
          />
        </View>

        {address.isDefault && (
          <View
            style={[
              styles.defaultBadge,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text style={[styles.defaultText, { color: theme.colors.white }]}>
              Default
            </Text>
          </View>
        )}
      </View>

      {/* Address details */}
      <View style={styles.detailsContainer}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {address.title}
        </Text>

        <Text
          style={[styles.address, { color: theme.colors.darkGray }]}
          numberOfLines={2}
        >
          {address.address}
        </Text>
      </View>

      {/* Action buttons */}
      {(showEditButton || showDeleteButton) && (
        <View style={styles.actionsContainer}>
          {selected && (
            <Icon
              name="check-circle"
              size={24}
              color={theme.colors.primary}
              style={styles.selectedIcon}
            />
          )}

          {showEditButton && onEdit && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.gray },
              ]}
              onPress={handleEdit}
            >
              <Icon name="pencil" size={18} color={theme.colors.text} />
            </TouchableOpacity>
          )}

          {showDeleteButton && onDelete && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.gray },
              ]}
              onPress={handleDelete}
            >
              <Icon name="delete" size={18} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 12,
    alignItems: "center",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  defaultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  detailsContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsContainer: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  selectedIcon: {
    marginBottom: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
});

export default AddressCard;
