import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Switch,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { launchImageLibrary } from "react-native-image-picker";
import { useTheme } from "../contexts/ThemeContext";
import { menuService } from "../api/menuService";

const AddEditMenuItemScreen = ({ route, navigation }) => {
  const { item, categories } = route.params || {};
  const isEditMode = !!item;
  const { theme } = useTheme();

  // Initial state for new menu item
  const initialItemState = {
    name: "",
    description: "",
    price: "",
    discountedPrice: "",
    categoryId: categories && categories.length > 0 ? categories[0]._id : "",
    isAvailable: true,
    image: null,
    options: [],
  };

  // State
  const [menuItem, setMenuItem] = useState(
    isEditMode ? { ...item } : initialItemState
  );
  const [imageUri, setImageUri] = useState(isEditMode ? item.image : null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Handle field changes
  const handleChange = (field, value) => {
    setMenuItem({
      ...menuItem,
      [field]: value,
    });

    // Clear error for field when changed
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: null,
      });
    }
  };

  // Handle image selection
  const handleSelectImage = async () => {
    const options = {
      mediaType: "photo",
      includeBase64: false,
      maxHeight: 1200,
      maxWidth: 1200,
    };

    try {
      const result = await launchImageLibrary(options);

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert("Error", result.errorMessage);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const source = result.assets[0].uri;
        setImageUri(source);
        handleChange("image", source);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  // Handle category selection
  const handleCategorySelect = (categoryId) => {
    handleChange("categoryId", categoryId);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!menuItem.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!menuItem.price) {
      newErrors.price = "Price is required";
    } else if (
      isNaN(parseFloat(menuItem.price)) ||
      parseFloat(menuItem.price) <= 0
    ) {
      newErrors.price = "Price must be a valid number greater than 0";
    }

    if (menuItem.discountedPrice) {
      if (isNaN(parseFloat(menuItem.discountedPrice))) {
        newErrors.discountedPrice = "Discounted price must be a valid number";
      } else if (
        parseFloat(menuItem.discountedPrice) >= parseFloat(menuItem.price)
      ) {
        newErrors.discountedPrice =
          "Discounted price must be less than regular price";
      }
    }

    if (!menuItem.categoryId) {
      newErrors.categoryId = "Category is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle option add
  const addOption = () => {
    const newOption = {
      title: "New Option Group",
      required: false,
      multiple: false,
      items: [{ name: "Option 1", price: 0 }],
    };

    handleChange("options", [...menuItem.options, newOption]);
  };

  // Handle option update
  const updateOption = (index, field, value) => {
    const updatedOptions = [...menuItem.options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      [field]: value,
    };
    handleChange("options", updatedOptions);
  };

  // Handle option item add
  const addOptionItem = (optionIndex) => {
    const updatedOptions = [...menuItem.options];
    const newItem = {
      name: `Option ${updatedOptions[optionIndex].items.length + 1}`,
      price: 0,
    };
    updatedOptions[optionIndex].items.push(newItem);
    handleChange("options", updatedOptions);
  };

  // Handle option item update
  const updateOptionItem = (optionIndex, itemIndex, field, value) => {
    const updatedOptions = [...menuItem.options];
    updatedOptions[optionIndex].items[itemIndex] = {
      ...updatedOptions[optionIndex].items[itemIndex],
      [field]: value,
    };
    handleChange("options", updatedOptions);
  };

  // Handle option delete
  const deleteOption = (index) => {
    Alert.alert(
      "Delete Option Group",
      "Are you sure you want to delete this option group?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedOptions = menuItem.options.filter(
              (_, i) => i !== index
            );
            handleChange("options", updatedOptions);
          },
        },
      ]
    );
  };

  // Handle option item delete
  const deleteOptionItem = (optionIndex, itemIndex) => {
    const updatedOptions = [...menuItem.options];
    updatedOptions[optionIndex].items = updatedOptions[
      optionIndex
    ].items.filter((_, i) => i !== itemIndex);
    handleChange("options", updatedOptions);
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Format menu item data
      const formattedItem = {
        name: menuItem.name,
        description: menuItem.description,
        price: parseFloat(menuItem.price),
        discountedPrice: menuItem.discountedPrice
          ? parseFloat(menuItem.discountedPrice)
          : undefined,
        categoryId: menuItem.categoryId,
        isAvailable: menuItem.isAvailable,
        options: menuItem.options,
      };

      let result;

      if (isEditMode) {
        // Update existing menu item
        result = await menuService.updateMenuItem(item._id, formattedItem);
      } else {
        // Create new menu item
        result = await menuService.createMenuItem(formattedItem);
      }

      // Upload image if selected
      if (imageUri && imageUri !== item?.image) {
        setUploading(true);
        await menuService.uploadMenuItemImage(result._id || item._id, imageUri);
      }

      Alert.alert(
        "Success",
        `Menu item ${isEditMode ? "updated" : "created"} successfully`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error("Save menu item error:", error);
      Alert.alert(
        "Error",
        `Failed to ${
          isEditMode ? "update" : "create"
        } menu item. Please try again.`
      );
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          style={[
            styles.container,
            { backgroundColor: theme.colors.background },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Section */}
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={handleSelectImage}
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.imagePlaceholder,
                  { backgroundColor: theme.colors.gray },
                ]}
              >
                <Icon
                  name="camera"
                  size={40}
                  color={theme.colors.placeholder}
                />
                <Text
                  style={[
                    styles.imagePlaceholderText,
                    { color: theme.colors.darkGray },
                  ]}
                >
                  Tap to add an image
                </Text>
              </View>
            )}
            <View
              style={[
                styles.editImageButton,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Icon name="pencil" size={20} color={theme.colors.white} />
            </View>
          </TouchableOpacity>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                Name *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.gray,
                    color: theme.colors.text,
                    borderColor: errors.name
                      ? theme.colors.error
                      : "transparent",
                  },
                ]}
                placeholder="Enter item name"
                placeholderTextColor={theme.colors.placeholder}
                value={menuItem.name}
                onChangeText={(text) => handleChange("name", text)}
              />
              {errors.name && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.name}
                </Text>
              )}
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                Description
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textareaInput,
                  {
                    backgroundColor: theme.colors.gray,
                    color: theme.colors.text,
                  },
                ]}
                placeholder="Enter item description"
                placeholderTextColor={theme.colors.placeholder}
                value={menuItem.description}
                onChangeText={(text) => handleChange("description", text)}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Price Inputs */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  Price *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.gray,
                      color: theme.colors.text,
                      borderColor: errors.price
                        ? theme.colors.error
                        : "transparent",
                    },
                  ]}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.placeholder}
                  value={menuItem.price.toString()}
                  onChangeText={(text) => handleChange("price", text)}
                  keyboardType="numeric"
                />
                {errors.price && (
                  <Text
                    style={[styles.errorText, { color: theme.colors.error }]}
                  >
                    {errors.price}
                  </Text>
                )}
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  Discounted Price
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.gray,
                      color: theme.colors.text,
                      borderColor: errors.discountedPrice
                        ? theme.colors.error
                        : "transparent",
                    },
                  ]}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.placeholder}
                  value={menuItem.discountedPrice?.toString() || ""}
                  onChangeText={(text) => handleChange("discountedPrice", text)}
                  keyboardType="numeric"
                />
                {errors.discountedPrice && (
                  <Text
                    style={[styles.errorText, { color: theme.colors.error }]}
                  >
                    {errors.discountedPrice}
                  </Text>
                )}
              </View>
            </View>

            {/* Category Selection */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                Category *
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesList}
              >
                {categories &&
                  categories.map((category) => (
                    <TouchableOpacity
                      key={category._id}
                      style={[
                        styles.categoryItem,
                        {
                          backgroundColor:
                            menuItem.categoryId === category._id
                              ? theme.colors.primary
                              : theme.colors.gray,
                        },
                      ]}
                      onPress={() => handleCategorySelect(category._id)}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          {
                            color:
                              menuItem.categoryId === category._id
                                ? theme.colors.white
                                : theme.colors.text,
                          },
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
              {errors.categoryId && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.categoryId}
                </Text>
              )}
            </View>

            {/* Availability Toggle */}
            <View style={styles.switchContainer}>
              <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
                Available for Order
              </Text>
              <Switch
                value={menuItem.isAvailable}
                onValueChange={(value) => handleChange("isAvailable", value)}
                trackColor={{
                  false: theme.colors.gray,
                  true: theme.colors.primary + "80",
                }}
                thumbColor={
                  menuItem.isAvailable
                    ? theme.colors.primary
                    : theme.colors.placeholder
                }
              />
            </View>

            {/* Item Options Section */}
            <View style={styles.optionsSection}>
              <View style={styles.sectionHeader}>
                <Text
                  style={[styles.sectionTitle, { color: theme.colors.text }]}
                >
                  Item Options
                </Text>
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={addOption}
                >
                  <Icon name="plus" size={16} color={theme.colors.white} />
                  <Text
                    style={[
                      styles.addButtonText,
                      { color: theme.colors.white },
                    ]}
                  >
                    Add Option Group
                  </Text>
                </TouchableOpacity>
              </View>

              {menuItem.options.length === 0 ? (
                <View
                  style={[
                    styles.emptyOptions,
                    { backgroundColor: theme.colors.gray },
                  ]}
                >
                  <Text
                    style={[
                      styles.emptyOptionsText,
                      { color: theme.colors.darkGray },
                    ]}
                  >
                    No options defined. Add option groups for customization
                    (e.g., sizes, toppings).
                  </Text>
                </View>
              ) : (
                menuItem.options.map((option, index) => (
                  <View
                    key={index}
                    style={[
                      styles.optionGroup,
                      { backgroundColor: theme.colors.card },
                    ]}
                  >
                    <View style={styles.optionGroupHeader}>
                      <Text
                        style={[
                          styles.optionGroupTitle,
                          { color: theme.colors.text },
                        ]}
                      >
                        {option.title}
                      </Text>
                      <TouchableOpacity
                        style={styles.deleteOptionButton}
                        onPress={() => deleteOption(index)}
                      >
                        <Icon
                          name="delete"
                          size={20}
                          color={theme.colors.error}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.optionForm}>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: theme.colors.gray,
                            color: theme.colors.text,
                          },
                        ]}
                        placeholder="Option Group Title"
                        placeholderTextColor={theme.colors.placeholder}
                        value={option.title}
                        onChangeText={(text) =>
                          updateOption(index, "title", text)
                        }
                      />

                      <View style={styles.optionSwitches}>
                        <View style={styles.optionSwitch}>
                          <Text
                            style={[
                              styles.optionSwitchLabel,
                              { color: theme.colors.text },
                            ]}
                          >
                            Required
                          </Text>
                          <Switch
                            value={option.required}
                            onValueChange={(value) =>
                              updateOption(index, "required", value)
                            }
                            trackColor={{
                              false: theme.colors.gray,
                              true: theme.colors.primary + "80",
                            }}
                            thumbColor={
                              option.required
                                ? theme.colors.primary
                                : theme.colors.placeholder
                            }
                          />
                        </View>

                        <View style={styles.optionSwitch}>
                          <Text
                            style={[
                              styles.optionSwitchLabel,
                              { color: theme.colors.text },
                            ]}
                          >
                            Multiple
                          </Text>
                          <Switch
                            value={option.multiple}
                            onValueChange={(value) =>
                              updateOption(index, "multiple", value)
                            }
                            trackColor={{
                              false: theme.colors.gray,
                              true: theme.colors.primary + "80",
                            }}
                            thumbColor={
                              option.multiple
                                ? theme.colors.primary
                                : theme.colors.placeholder
                            }
                          />
                        </View>
                      </View>

                      <Text
                        style={[
                          styles.optionItemsTitle,
                          { color: theme.colors.text },
                        ]}
                      >
                        Items:
                      </Text>

                      {option.items.map((item, itemIndex) => (
                        <View key={itemIndex} style={styles.optionItemForm}>
                          <View style={styles.optionItemInputs}>
                            <TextInput
                              style={[
                                styles.input,
                                styles.optionItemNameInput,
                                {
                                  backgroundColor: theme.colors.gray,
                                  color: theme.colors.text,
                                },
                              ]}
                              placeholder="Option name"
                              placeholderTextColor={theme.colors.placeholder}
                              value={item.name}
                              onChangeText={(text) =>
                                updateOptionItem(index, itemIndex, "name", text)
                              }
                            />
                            <TextInput
                              style={[
                                styles.input,
                                styles.optionItemPriceInput,
                                {
                                  backgroundColor: theme.colors.gray,
                                  color: theme.colors.text,
                                },
                              ]}
                              placeholder="+$0.00"
                              placeholderTextColor={theme.colors.placeholder}
                              value={item.price.toString()}
                              onChangeText={(text) =>
                                updateOptionItem(
                                  index,
                                  itemIndex,
                                  "price",
                                  text === "" ? 0 : parseFloat(text)
                                )
                              }
                              keyboardType="numeric"
                            />
                          </View>
                          <TouchableOpacity
                            style={styles.deleteOptionItemButton}
                            onPress={() => deleteOptionItem(index, itemIndex)}
                          >
                            <Icon
                              name="close-circle"
                              size={20}
                              color={theme.colors.error}
                            />
                          </TouchableOpacity>
                        </View>
                      ))}

                      <TouchableOpacity
                        style={[
                          styles.addOptionItemButton,
                          { borderColor: theme.colors.primary },
                        ]}
                        onPress={() => addOptionItem(index)}
                      >
                        <Icon
                          name="plus"
                          size={16}
                          color={theme.colors.primary}
                        />
                        <Text
                          style={[
                            styles.addOptionItemText,
                            { color: theme.colors.primary },
                          ]}
                        >
                          Add Option Item
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor:
                    loading || uploading
                      ? theme.colors.gray
                      : theme.colors.primary,
                },
              ]}
              onPress={handleSave}
              disabled={loading || uploading}
            >
              {loading || uploading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={theme.colors.white} />
                  <Text
                    style={[styles.loadingText, { color: theme.colors.white }]}
                  >
                    {uploading ? "Uploading image..." : "Saving..."}
                  </Text>
                </View>
              ) : (
                <Text
                  style={[styles.saveButtonText, { color: theme.colors.white }]}
                >
                  {isEditMode ? "Update Menu Item" : "Create Menu Item"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  imageContainer: {
    width: "100%",
    height: 200,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
  },
  editImageButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  textareaInput: {
    height: 100,
    paddingVertical: 12,
    textAlignVertical: "top",
  },
  rowInputs: {
    flexDirection: "row",
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  categoriesList: {
    paddingVertical: 8,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  optionsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  emptyOptions: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  emptyOptionsText: {
    fontSize: 14,
    textAlign: "center",
  },
  optionGroup: {
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
  },
  optionGroupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  optionGroupTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteOptionButton: {
    padding: 4,
  },
  optionForm: {
    width: "100%",
  },
  optionSwitches: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  optionSwitch: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionSwitchLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  optionItemsTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    marginTop: 8,
  },
  optionItemForm: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  optionItemInputs: {
    flexDirection: "row",
    flex: 1,
  },
  optionItemNameInput: {
    flex: 0.7,
    marginRight: 8,
  },
  optionItemPriceInput: {
    flex: 0.3,
  },
  deleteOptionItemButton: {
    padding: 8,
    marginLeft: 8,
  },
  addOptionItemButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: 8,
  },
  addOptionItemText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  saveButton: {
    height: 56,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AddEditMenuItemScreen;
