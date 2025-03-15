import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import { useTheme } from "../../contexts/ThemeContext";

const DatePicker = ({
  label,
  value,
  onChange,
  placeholder = "Select a date",
  icon = "calendar",
  error,
  minimumDate,
  maximumDate,
  disabled = false,
  formatDate,
  ...props
}: any) => {
  const { theme } = useTheme();

  // States
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value || new Date());

  // Format the date for display
  const getFormattedDate = (date: any) => {
    if (!date) return "";

    if (formatDate) {
      return formatDate(date);
    }

    // Default date formatting
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Handle date change
  const handleChange = (event: any, selectedDate: any) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }

    if (selectedDate) {
      setTempDate(selectedDate);

      if (Platform.OS === "ios") {
        // For iOS, don't update parent value until "Done" is pressed
      } else {
        // For Android, update parent value immediately
        onChange(selectedDate);
      }
    }
  };

  // Handle confirm for iOS
  const handleIOSConfirm = () => {
    onChange(tempDate);
    setShowPicker(false);
  };

  // Handle cancel for iOS
  const handleIOSCancel = () => {
    setShowPicker(false);
  };

  // Show the date picker
  const showDatePicker = () => {
    if (disabled) return;
    setShowPicker(true);
  };

  return (
    <View style={styles.container}>
      {/* Label */}
      {label && (
        <Text
          style={[
            styles.label,
            { color: error ? theme.colors.error : theme.colors.text },
          ]}
        >
          {label}
        </Text>
      )}

      {/* Date Display / Button */}
      <TouchableOpacity
        style={[
          styles.dateButton,
          {
            borderColor: error ? theme.colors.error : theme.colors.border,
            backgroundColor: disabled
              ? theme.colors.gray
              : theme.colors.background,
          },
        ]}
        onPress={showDatePicker}
        disabled={disabled}
      >
        <Icon
          name={icon}
          size={20}
          color={error ? theme.colors.error : theme.colors.darkGray}
          style={styles.icon}
        />
        <Text
          style={[
            styles.dateText,
            {
              color: value ? theme.colors.text : theme.colors.placeholder,
            },
          ]}
        >
          {value ? getFormattedDate(value) : placeholder}
        </Text>
      </TouchableOpacity>

      {/* Error Message */}
      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}

      {/* Date Picker for Android */}
      {Platform.OS === "android" && showPicker && (
        <DateTimePicker
          value={tempDate || new Date()}
          mode="date"
          display="default"
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          {...props}
        />
      )}

      {/* Date Picker Modal for iOS */}
      {Platform.OS === "ios" && (
        <Modal
          transparent={true}
          visible={showPicker}
          animationType="slide"
          onRequestClose={handleIOSCancel}
        >
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: "rgba(0, 0, 0, 0.5)" },
            ]}
          >
            <View
              style={[
                styles.pickerContainer,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <View style={styles.pickerHeader}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={handleIOSCancel}
                >
                  <Text
                    style={[
                      styles.headerButtonText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={handleIOSConfirm}
                >
                  <Text
                    style={[
                      styles.headerButtonText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate || new Date()}
                mode="date"
                display="spinner"
                onChange={handleChange}
                style={styles.iOSPicker}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                {...props}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  pickerContainer: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  headerButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  iOSPicker: {
    height: 216,
  },
});

export default DatePicker;
