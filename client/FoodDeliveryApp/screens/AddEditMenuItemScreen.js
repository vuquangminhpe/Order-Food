import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { launchImageLibrary } from "react-native-image-picker";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { menuService } from "../api/menuService";

const AddEditMenuItemScreen = ({ route, navigation }) => {
  const { item, categories } = route.params || {};
  const isEditMode = !!item;

  const { theme } = useTheme();
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Form fields
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [price, setPrice] = useState(item?.price ? item.price.toString() : "");
  const [discountedPrice, setDiscountedPrice] = useState(
    item?.discountedPrice ? item.discountedPrice.toString() : ""
  );
  const [categoryId, setCategoryId] = useState(item?.categoryId || "");
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable !== false);
  const [image, setImage] = useState(item?.image || null);

  // Options management
  const [options, setOptions] = useState(item?.options || []);
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionRequired, setNewOptionRequired] = useState(false);
  const [newOptionMultiple, setNewOptionMultiple] = useState(false);
  const [showOptionForm, setShowOptionForm] = useState(false);

  // Option items management
  const [currentOptionIndex, setCurrentOptionIndex] = useState(null);
  const [newOptionItemName, setNewOptionItemName] = useState("");
  const [newOptionItemPrice, setNewOptionItemPrice] = useState("");
  const [showOptionItemForm, setShowOptionItemForm] = useState(false);

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!name.trim()) errors.name = "Menu item name is required";
    if (!price.trim()) errors.price = "Price is required";
    else if (isNaN(parseFloat(price)) || parseFloat(price) < 0)
      errors.price = "Price must be a valid number";

    if (
      discountedPrice.trim() &&
      (isNaN(parseFloat(discountedPrice)) ||
        parseFloat(discountedPrice) < 0 ||
        parseFloat(discountedPrice) > parseFloat(price))
    ) {
      errors.discountedPrice =
        "Discounted price must be a valid number less than or equal to the regular price";
    }

    if (!categoryId) errors.categoryId = "Please select a category";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle image picker
  const handleSelectImage = async () => {
    const options = {
      mediaType: "photo",
      includeBase64: false,
      maxHeight: 800,
      maxWidth: 800,
    };

    try {
      const result = await launchImageLibrary(options);

      if (result.didCancel) return;
      if (result.errorCode) {
        console.error("ImagePicker Error: ", result.errorMessage);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const source = result.assets[0].uri;
        setImage(source);

        // In a real app, you would upload the image immediately or on form submit
        if (isEditMode) {
          handleUploadImage(source);
        }
      }
    } catch (err) {
      console.error("Image picker error:", err);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  // Upload image to server
  const handleUploadImage = async (imageUri) => {
    if (!imageUri) return;

    try {
      setImageLoading(true);

      // For edit mode, upload to the existing item
      if (isEditMode && item?._id) {
        await menuService.uploadMenuItemImage(item._id, imageUri);
      }
      // For new items, the image will be uploaded after the item is created
    } catch (error) {
      console.error("Upload image error:", error);
      Alert.alert("Error", "Failed to upload image");
    } finally {
      setImageLoading(false);
    }
  };

  // Handle add option
  const handleAddOption = () => {
    if (!newOptionName.trim()) {
      Alert.alert("Error", "Option name is required");
      return;
    }

    const newOption = {
      title: newOptionName.trim(),
      required: newOptionRequired,
      multiple: newOptionMultiple,
      items: [],
    };

    setOptions([...options, newOption]);

    // Reset form
    setNewOptionName("");
    setNewOptionRequired(false);
    setNewOptionMultiple(false);
    setShowOptionForm(false);
  };

  // Handle edit option
  const handleEditOption = (index) => {
    // This would normally open the option form pre-filled with the option data
    const option = options[index];
    setNewOptionName(option.title);
    setNewOptionRequired(option.required);
    setNewOptionMultiple(option.multiple);

    // Instead of adding a new option, we'd update the existing one
    // For simplicity, we'll just show/hide the form here
    setShowOptionForm(true);
  };

  // Handle delete option
  const handleDeleteOption = (index) => {
    Alert.alert(
      "Delete Option",
      "Are you sure you want to delete this option?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const newOptions = [...options];
            newOptions.splice(index, 1);
            setOptions(newOptions);
          },
        },
      ]
    );
  };

  // Show add option item form
  const handleShowAddOptionItem = (optionIndex) => {
    setCurrentOptionIndex(optionIndex);
    setNewOptionItemName("");
    setNewOptionItemPrice("");
    setShowOptionItemForm(true);
  };

  // Handle add option item
  const handleAddOptionItem = () => {
    if (!newOptionItemName.trim()) {
      Alert.alert("Error", "Option item name is required");
      return;
    }

    if (
      !newOptionItemPrice.trim() ||
      isNaN(parseFloat(newOptionItemPrice)) ||
      parseFloat(newOptionItemPrice) < 0
    ) {
      Alert.alert("Error", "Option item price must be a valid number");
      return;
    }

    const newItem = {
      name: newOptionItemName.trim(),
      price: parseFloat(newOptionItemPrice),
    };

    const newOptions = [...options];
    newOptions[currentOptionIndex].items.push(newItem);
    setOptions(newOptions);

    // Reset form
    setNewOptionItemName("");
    setNewOptionItemPrice("");
    setShowOptionItemForm(false);
  };

  // Handle delete option item
  const handleDeleteOptionItem = (optionIndex, itemIndex) => {
    const newOptions = [...options];
    newOptions[optionIndex].items.splice(itemIndex, 1);
    setOptions(newOptions);
  };

  // Handle save menu item
  const handleSaveMenuItem = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const menuItemData = {
        name,
        description,
        price: parseFloat(price),
        discountedPrice: discountedPrice
          ? parseFloat(discountedPrice)
          : undefined,
        categoryId,
        isAvailable,
        options,
        restaurantId: user?.restaurantId,
      };

      let result;

      if (isEditMode) {
        // Update existing item
        result = await menuService.updateMenuItem(item._id, menuItemData);

        // If we have a new image that hasn't been uploaded yet, upload it now
        if (image && image !== item.image) {
          await handleUploadImage(image);
        }

        Alert.alert("Success", "Menu item updated successfully", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        // Create new item
        result = await menuService.createMenuItem(menuItemData);

        // If we have an image, upload it to the new item
        if (image) {
          await menuService.uploadMenuItemImage(result._id, image);
        }

        Alert.alert("Success", "Menu item created successfully", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      console.error("Save menu item error:", err);
      setError("Failed to save menu item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Menu Item Image */}
          <View style={styles.imageContainer}>
            {imageLoading ? (
              <View
                style={[
                  styles.imagePlaceholder,
                  { backgroundColor: theme.colors.gray },
                ]}
              >
                <ActivityIndicator color={theme.colors.primary} size="large" />
              </View>
            ) : image ? (
              <Image
                source={{ uri: image }}
                style={styles.itemImage}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.imagePlaceholder,
                  { backgroundColor: theme.colors.gray },
                ]}
              >
                <Icon name="food" size={60} color={theme.colors.placeholder} />
                <Text
                  style={[
                    styles.imagePlaceholderText,
                    { color: theme.colors.darkGray },
                  ]}
                >
                  Tap to add image
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.editImageButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleSelectImage}
            >
              <Icon name="camera" size={20} color={theme.colors.white} />
            </TouchableOpacity>
          </View>

          {/* Basic Information Form */}
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Basic Information
            </Text>

            {/* Name Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                Name*
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.gray,
                    color: theme.colors.text,
                    borderColor: formErrors.name
                      ? theme.colors.error
                      : theme.colors.gray,
                  },
                ]}
                placeholder="Item name"
                placeholderTextColor={theme.colors.placeholder}
                value={name}
                onChangeText={setName}
              />
              {formErrors.name && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {formErrors.name}
                </Text>
              )}
            </View>

            {/* Description Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                Description
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  styles.textArea,
                  {
                    backgroundColor: theme.colors.gray,
                    color: theme.colors.text,
                  },
                ]}
                placeholder="Item description"
                placeholderTextColor={theme.colors.placeholder}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Price Inputs */}
            <View style={styles.priceContainer}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  Price*
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.colors.gray,
                      color: theme.colors.text,
                      borderColor: formErrors.price
                        ? theme.colors.error
                        : theme.colors.gray,
                    },
                  ]}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.placeholder}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                />
                {formErrors.price && (
                  <Text
                    style={[styles.errorText, { color: theme.colors.error }]}
                  >
                    {formErrors.price}
                  </Text>
                )}
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  Discounted Price
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.colors.gray,
                      color: theme.colors.text,
                      borderColor: formErrors.discountedPrice
                        ? theme.colors.error
                        : theme.colors.gray,
                    },
                  ]}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.placeholder}
                  value={discountedPrice}
                  onChangeText={setDiscountedPrice}
                  keyboardType="decimal-pad"
                />
                {formErrors.discountedPrice && (
                  <Text
                    style={[styles.errorText, { color: theme.colors.error }]}
                  >
                    {formErrors.discountedPrice}
                  </Text>
                )}
              </View>
            </View>

            {/* Category Dropdown */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                Category*
              </Text>
              <View
                style={[
                  styles.categoryDropdown,
                  {
                    backgroundColor: theme.colors.gray,
                    borderColor: formErrors.categoryId
                      ? theme.colors.error
                      : theme.colors.gray,
                  },
                ]}
              >
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {categories?.map((category) => (
                    <TouchableOpacity
                      key={category._id}
                      style={[
                        styles.categoryOption,
                        categoryId === category._id && {
                          backgroundColor: theme.colors.primary + "20",
                          borderColor: theme.colors.primary,
                        },
                      ]}
                      onPress={() => setCategoryId(category._id)}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          {
                            color:
                              categoryId === category._id
                                ? theme.colors.primary
                                : theme.colors.text,
                          },
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              {formErrors.categoryId && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {formErrors.categoryId}
                </Text>
              )}
            </View>

            {/* Availability Toggle */}
            <View style={styles.switchContainer}>
              <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
                Available for order
              </Text>
              <Switch
                value={isAvailable}
                onValueChange={setIsAvailable}
                trackColor={{
                  false: theme.colors.gray,
                  true: theme.colors.primary + "50",
                }}
                thumbColor={
                  isAvailable ? theme.colors.primary : theme.colors.placeholder
                }
              />
            </View>
          </View>

          {/* Options Section */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Item Options
              </Text>
              <TouchableOpacity
                style={[
                  styles.addButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => setShowOptionForm(true)}
              >
                <Icon name="plus" size={16} color={theme.colors.white} />
                <Text
                  style={[styles.addButtonText, { color: theme.colors.white }]}
                >
                  Add Option
                </Text>
              </TouchableOpacity>
            </View>

            {/* Options List */}
            {options.length === 0 ? (
              <Text
                style={[styles.emptyText, { color: theme.colors.darkGray }]}
              >
                No options added yet. Options allow customers to customize their
                order.
              </Text>
            ) : (
              <View style={styles.optionsList}>
                {options.map((option, index) => (
                  <View
                    key={index}
                    style={[
                      styles.optionCard,
                      { backgroundColor: theme.colors.card },
                    ]}
                  >
                    <View style={styles.optionHeader}>
                      <Text
                        style={[
                          styles.optionTitle,
                          { color: theme.colors.text },
                        ]}
                      >
                        {option.title}
                      </Text>
                      <View style={styles.optionActions}>
                        <TouchableOpacity
                          style={[
                            styles.optionAction,
                            { backgroundColor: theme.colors.gray },
                          ]}
                          onPress={() => handleEditOption(index)}
                        >
                          <Icon
                            name="pencil"
                            size={16}
                            color={theme.colors.darkGray}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.optionAction,
                            { backgroundColor: theme.colors.error + "20" },
                          ]}
                          onPress={() => handleDeleteOption(index)}
                        >
                          <Icon
                            name="delete"
                            size={16}
                            color={theme.colors.error}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.optionDetailsRow}>
                      <View style={styles.optionBadge}>
                        <Text style={styles.optionBadgeText}>
                          {option.required ? "Required" : "Optional"}
                        </Text>
                      </View>
                      <View style={styles.optionBadge}>
                        <Text style={styles.optionBadgeText}>
                          {option.multiple
                            ? "Multiple Selection"
                            : "Single Selection"}
                        </Text>
                      </View>
                    </View>

                    {/* Option Items */}
                    <View style={styles.optionItems}>
                      {option.items.length === 0 ? (
                        <Text
                          style={[
                            styles.emptyText,
                            { color: theme.colors.darkGray },
                          ]}
                        >
                          No items added to this option yet.
                        </Text>
                      ) : (
                        option.items.map((item, itemIndex) => (
                          <View
                            key={itemIndex}
                            style={[
                              styles.optionItem,
                              itemIndex < option.items.length - 1 && {
                                borderBottomWidth: 1,
                                borderBottomColor: theme.colors.border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.optionItemName,
                                { color: theme.colors.text },
                              ]}
                            >
                              {item.name}
                            </Text>
                            <View style={styles.optionItemRight}>
                              <Text
                                style={[
                                  styles.optionItemPrice,
                                  { color: theme.colors.text },
                                ]}
                              >
                                +${item.price.toFixed(2)}
                              </Text>
                              <TouchableOpacity
                                onPress={() =>
                                  handleDeleteOptionItem(index, itemIndex)
                                }
                              >
                                <Icon
                                  name="close"
                                  size={16}
                                  color={theme.colors.error}
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))
                      )}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.addItemButton,
                        { borderColor: theme.colors.primary },
                      ]}
                      onPress={() => handleShowAddOptionItem(index)}
                    >
                      <Icon
                        name="plus"
                        size={16}
                        color={theme.colors.primary}
                      />
                      <Text
                        style={[
                          styles.addItemText,
                          { color: theme.colors.primary },
                        ]}
                      >
                        Add Item
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Add Option Form */}
            {showOptionForm && (
              <View
                style={[
                  styles.formCard,
                  { backgroundColor: theme.colors.card },
                ]}
              >
                <View style={styles.formCardHeader}>
                  <Text
                    style={[styles.formCardTitle, { color: theme.colors.text }]}
                  >
                    Add Option Group
                  </Text>
                  <TouchableOpacity onPress={() => setShowOptionForm(false)}>
                    <Icon
                      name="close"
                      size={20}
                      color={theme.colors.darkGray}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                  <Text
                    style={[styles.inputLabel, { color: theme.colors.text }]}
                  >
                    Option Name*
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.colors.gray,
                        color: theme.colors.text,
                      },
                    ]}
                    placeholder="e.g. Size, Toppings, etc."
                    placeholderTextColor={theme.colors.placeholder}
                    value={newOptionName}
                    onChangeText={setNewOptionName}
                  />
                </View>

                <View style={styles.switchContainer}>
                  <Text
                    style={[styles.switchLabel, { color: theme.colors.text }]}
                  >
                    Required
                  </Text>
                  <Switch
                    value={newOptionRequired}
                    onValueChange={setNewOptionRequired}
                    trackColor={{
                      false: theme.colors.gray,
                      true: theme.colors.primary + "50",
                    }}
                    thumbColor={
                      newOptionRequired
                        ? theme.colors.primary
                        : theme.colors.placeholder
                    }
                  />
                </View>

                <View style={styles.switchContainer}>
                  <Text
                    style={[styles.switchLabel, { color: theme.colors.text }]}
                  >
                    Allow Multiple Selections
                  </Text>
                  <Switch
                    value={newOptionMultiple}
                    onValueChange={setNewOptionMultiple}
                    trackColor={{
                      false: theme.colors.gray,
                      true: theme.colors.primary + "50",
                    }}
                    thumbColor={
                      newOptionMultiple
                        ? theme.colors.primary
                        : theme.colors.placeholder
                    }
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={handleAddOption}
                >
                  <Text
                    style={[
                      styles.saveButtonText,
                      { color: theme.colors.white },
                    ]}
                  >
                    Add Option
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Add Option Item Form */}
            {showOptionItemForm && (
              <View
                style={[
                  styles.formCard,
                  { backgroundColor: theme.colors.card },
                ]}
              >
                <View style={styles.formCardHeader}>
                  <Text
                    style={[styles.formCardTitle, { color: theme.colors.text }]}
                  >
                    Add Option Item
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowOptionItemForm(false)}
                  >
                    <Icon
                      name="close"
                      size={20}
                      color={theme.colors.darkGray}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                  <Text
                    style={[styles.inputLabel, { color: theme.colors.text }]}
                  >
                    Item Name*
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.colors.gray,
                        color: theme.colors.text,
                      },
                    ]}
                    placeholder="e.g. Small, Extra Cheese, etc."
                    placeholderTextColor={theme.colors.placeholder}
                    value={newOptionItemName}
                    onChangeText={setNewOptionItemName}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text
                    style={[styles.inputLabel, { color: theme.colors.text }]}
                  >
                    Additional Price*
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.colors.gray,
                        color: theme.colors.text,
                      },
                    ]}
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.placeholder}
                    value={newOptionItemPrice}
                    onChangeText={setNewOptionItemPrice}
                    keyboardType="decimal-pad"
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={handleAddOptionItem}
                >
                  <Text
                    style={[
                      styles.saveButtonText,
                      { color: theme.colors.white },
                    ]}
                  >
                    Add Item
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Error message if any */}
          {error && (
            <View
              style={[
                styles.errorContainer,
                { backgroundColor: "rgba(255, 0, 0, 0.1)" },
              ]}
            >
              <Icon name="alert-circle" size={20} color={theme.colors.error} />
              <Text
                style={[styles.errorMessage, { color: theme.colors.error }]}
              >
                {error}
              </Text>
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: loading
                  ? theme.colors.gray
                  : theme.colors.primary,
              },
            ]}
            onPress={handleSaveMenuItem}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.white} size="small" />
            ) : (
              <Text
                style={[styles.submitButtonText, { color: theme.colors.white }]}
              >
                {isEditMode ? "Update Menu Item" : "Add Menu Item"}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  itemImage: {
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
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  formSection: {
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
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: 12,
    paddingBottom: 12,
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  categoryDropdown: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
    fontStyle: "italic",
    marginVertical: 16,
  },
  optionsList: {
    marginTop: 8,
  },
  optionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  optionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  optionActions: {
    flexDirection: "row",
  },
  optionAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  optionDetailsRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  optionBadge: {
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  optionBadgeText: {
    fontSize: 12,
  },
  optionItems: {
    marginTop: 8,
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  optionItemName: {
    fontSize: 14,
  },
  optionItemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionItemPrice: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 12,
  },
  addItemButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  addItemText: {
    fontSize: 14,
    marginLeft: 8,
  },
  formCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  formCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  formCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  errorMessage: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  submitButton: {
    height: 56,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default AddEditMenuItemScreen;
