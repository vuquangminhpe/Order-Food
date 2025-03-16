import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";

const OptionGroup = ({ optionGroup, selectedItems = [], onSelect }: any) => {
  const { theme } = useTheme();

  const isSelected = (item: any) => {
    return selectedItems.some(
      (selectedItem: any) => selectedItem.name === item.name
    );
  };

  const handleSelect = (item: any) => {
    const selected = isSelected(item);
    onSelect(item, !selected);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={[styles.groupTitle, { color: theme.colors.text }]}>
          {optionGroup.title}
        </Text>

        {optionGroup.required && (
          <Text style={[styles.requiredTag, { color: theme.colors.primary }]}>
            Required
          </Text>
        )}

        {optionGroup.multiple && (
          <Text style={[styles.multipleTag, { color: theme.colors.info }]}>
            Select multiple
          </Text>
        )}
      </View>

      {optionGroup.description && (
        <Text style={[styles.description, { color: theme.colors.darkGray }]}>
          {optionGroup.description}
        </Text>
      )}

      <View style={styles.optionsContainer}>
        {optionGroup.items.map((item: any, index: any) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionItem,
              {
                borderColor: isSelected(item)
                  ? theme.colors.primary
                  : theme.colors.border,
                backgroundColor: isSelected(item)
                  ? theme.colors.highlight
                  : theme.colors.background,
              },
            ]}
            onPress={() => handleSelect(item)}
          >
            <View style={styles.optionInfo}>
              <Text style={[styles.optionName, { color: theme.colors.text }]}>
                {item.name}
              </Text>

              {item.price > 0 && (
                <Text
                  style={[styles.optionPrice, { color: theme.colors.darkGray }]}
                >
                  +${item.price.toFixed(2)}
                </Text>
              )}
            </View>

            <View
              style={[
                styles.checkbox,
                {
                  borderColor: isSelected(item)
                    ? theme.colors.primary
                    : theme.colors.border,
                  backgroundColor: isSelected(item)
                    ? theme.colors.primary
                    : "transparent",
                },
              ]}
            >
              {isSelected(item) && (
                <MaterialCommunityIcons
                  name="check"
                  size={16}
                  color={theme.colors.white}
                />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  requiredTag: {
    fontSize: 12,
    fontWeight: "500",
    marginRight: 8,
  },
  multipleTag: {
    fontSize: 12,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  optionPrice: {
    fontSize: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default OptionGroup;
