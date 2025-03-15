import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { restaurantService } from "../api/restaurantService";
import { launchImageLibrary } from "react-native-image-picker";

type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

const EditRestaurantProfileScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  // State for restaurant data
  const [restaurant, setRestaurant] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    deliveryFee: 0,
    minOrderAmount: 0,
    preparationTime: 30,
    active: true,
    categories: [],
    openingHours: {
      monday: { open: "09:00", close: "22:00", isOpen: true },
      tuesday: { open: "09:00", close: "22:00", isOpen: true },
      wednesday: { open: "09:00", close: "22:00", isOpen: true },
      thursday: { open: "09:00", close: "22:00", isOpen: true },
      friday: { open: "09:00", close: "22:00", isOpen: true },
      saturday: { open: "09:00", close: "22:00", isOpen: true },
      sunday: { open: "09:00", close: "22:00", isOpen: true },
    },
    offerDelivery: false,
    coverImage: "",
    logo: "",
    gallery: [] as string[],
    offerPickup: false,
  });

  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoImage, setLogoImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState("general"); // 'general', 'hours', 'images', 'delivery'

  // Fetch restaurant data
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get restaurant ID from user
        const restaurantId = user?.restaurantId || "1"; // Fallback to a default ID for demo

        // Fetch restaurant details
        const restaurantData = await restaurantService.getRestaurantById(
          restaurantId
        );

        // Set state with fetched data
        setRestaurant(restaurantData);

        // Set images
        if (restaurantData.logo) {
          setLogoImage(restaurantData.logo);
        }
        if (restaurantData.coverImage) {
          setCoverImage(restaurantData.coverImage);
        }
        if (restaurantData.gallery && restaurantData.gallery.length > 0) {
          setGalleryImages(restaurantData.gallery);
        }
      } catch (err) {
        console.error("Error fetching restaurant data:", err);
        setError("Failed to load restaurant data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [user]);

  // Handle form input changes
  const handleChange = (key: string, value: string | number | boolean) => {
    setRestaurant((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  const handleHoursChange = (
    day: DayOfWeek,
    field: string,
    value: string | boolean
  ) => {
    // Handle opening hours changes
    const handleHoursChange = (
      day: DayOfWeek,
      field: string,
      value: string | boolean
    ) => {
      setRestaurant((prev) => ({
        ...prev,
        openingHours: {
          ...prev.openingHours,
          [day]: {
            ...prev.openingHours[day],
            [field]: value,
          },
        },
      }));
    };

    // Handle selecting logo image
    const handleSelectLogo = async () => {
      const options = {
        mediaType: "photo" as const,
        quality: 0.8,
        maxWidth: 1000,
        maxHeight: 1000,
      };

      try {
        const result = await launchImageLibrary(options as any);

        if (result.didCancel) return;
        if (result.errorCode) {
          Alert.alert("Error", result.errorMessage);
          return;
        }

        if (result.assets && result.assets.length > 0) {
          const selectedImage = result.assets[0];
          setLogoImage(selectedImage.uri as any);
        }
      } catch (error) {
        console.error("Image picker error:", error);
        Alert.alert("Error", "Failed to select image");
      }
    };

    // Handle selecting cover image
    const handleSelectCover = async () => {
      const options = {
        mediaType: "photo",
        quality: 0.8,
        maxWidth: 2000,
        maxHeight: 1000,
      };

      try {
        const result = await launchImageLibrary(options as any);

        if (result.didCancel) return;
        if (result.errorCode) {
          Alert.alert("Error", result.errorMessage);
          return;
        }

        if (result.assets && result.assets.length > 0) {
          const selectedImage = result.assets[0];
          setCoverImage(selectedImage.uri as any);
        }
      } catch (error) {
        console.error("Image picker error:", error);
        Alert.alert("Error", "Failed to select image");
      }
    };

    // Handle selecting gallery images
    const handleSelectGalleryImages = async () => {
      const options = {
        mediaType: "photo",
        quality: 0.8,
        selectionLimit: 5, // Allow multiple selection
        maxWidth: 1200,
        maxHeight: 1200,
      };

      try {
        const result = await launchImageLibrary(options as any);

        if (result.didCancel) return;
        if (result.errorCode) {
          Alert.alert("Error", result.errorMessage);
          return;
        }

        if (result.assets && result.assets.length > 0) {
          // Add newly selected images to existing ones
          const newImages = result.assets
            .map((asset) => asset.uri)
            .filter((uri): uri is string => !!uri);
          setGalleryImages([...galleryImages, ...newImages]);
        }
      } catch (error) {
        console.error("Image picker error:", error);
        Alert.alert("Error", "Failed to select images");
      }
    };

    // Remove gallery image
    const removeGalleryImage = (index: number) => {
      setGalleryImages(galleryImages.filter((_, i) => i !== index));
    };

    // Handle save changes
    const handleSave = async () => {
      try {
        setSaving(true);
        setError(null);

        // Validate form data
        if (!restaurant.name?.trim()) {
          setError("Restaurant name is required");
          setSaving(false);
          return;
        }

        // Get restaurant ID
        const restaurantId = user?.restaurantId || "1";

        // Update restaurant data
        await restaurantService.updateRestaurant(restaurantId, restaurant);

        // Upload logo if changed
        if (logoImage && logoImage !== restaurant.logo) {
          await restaurantService.uploadRestaurantImages(restaurantId, "logo", [
            logoImage,
          ]);
        }

        // Upload cover image if changed
        if (coverImage && coverImage !== restaurant.coverImage) {
          await restaurantService.uploadRestaurantImages(
            restaurantId,
            "cover",
            [coverImage]
          );
        }

        // Upload gallery images if changed
        // In a real app, you would need to handle comparing which ones are new vs. existing
        if (galleryImages.length > 0) {
          const newImages = galleryImages.filter(
            (image: string) => !restaurant.gallery.includes(image)
          );

          if (newImages.length > 0) {
            await restaurantService.uploadRestaurantImages(
              restaurantId,
              "gallery",
              newImages
            );
          }
        }

        Alert.alert("Success", "Restaurant profile updated successfully", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } catch (err) {
        console.error("Update restaurant error:", err);
        setError("Failed to update restaurant profile. Please try again.");
      } finally {
        setSaving(false);
      }
    };

    // Render General tab content
    const renderGeneralTab = () => (
      <View style={styles.tabContent}>
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
            Restaurant Name*
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.gray,
                color: theme.colors.text,
              },
            ]}
            value={restaurant.name}
            onChangeText={(text) => handleChange("name", text)}
            placeholder="Enter restaurant name"
            placeholderTextColor={theme.colors.placeholder}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
            Description
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.colors.gray,
                color: theme.colors.text,
              },
            ]}
            value={restaurant.description}
            onChangeText={(text) => handleChange("description", text)}
            placeholder="Enter restaurant description"
            placeholderTextColor={theme.colors.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
            Address
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.gray,
                color: theme.colors.text,
              },
            ]}
            value={restaurant.address}
            onChangeText={(text) => handleChange("address", text)}
            placeholder="Enter restaurant address"
            placeholderTextColor={theme.colors.placeholder}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
            Phone Number
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.gray,
                color: theme.colors.text,
              },
            ]}
            value={restaurant.phone}
            onChangeText={(text) => handleChange("phone", text)}
            placeholder="Enter phone number"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
            Email
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.gray,
                color: theme.colors.text,
              },
            ]}
            value={restaurant.email}
            onChangeText={(text) => handleChange("email", text)}
            placeholder="Enter email address"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.switchContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
            Restaurant Status
          </Text>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
              {restaurant.active ? "Active" : "Inactive"}
            </Text>
            <Switch
              value={restaurant.active}
              onValueChange={(value) => handleChange("active", value)}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.success + "50",
              }}
              thumbColor={
                restaurant.active
                  ? theme.colors.success
                  : theme.colors.placeholder
              }
            />
          </View>
        </View>
      </View>
    );

    // Render Hours tab content
    const renderHoursTab = () => {
      const days = [
        { id: "monday", label: "Monday" },
        { id: "tuesday", label: "Tuesday" },
        { id: "wednesday", label: "Wednesday" },
        { id: "thursday", label: "Thursday" },
        { id: "friday", label: "Friday" },
        { id: "saturday", label: "Saturday" },
        { id: "sunday", label: "Sunday" },
      ];

      return (
        <View style={styles.tabContent}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Opening Hours
          </Text>

          {days.map((day: any) => (
            <View key={day.id} style={styles.hoursRow}>
              <View style={styles.dayContainer}>
                <Text style={[styles.dayLabel, { color: theme.colors.text }]}>
                  {day.label}
                </Text>
                <Switch
                  value={restaurant.openingHours[day.id as DayOfWeek]?.isOpen}
                  onValueChange={(value) =>
                    handleHoursChange(day.id, "isOpen", value)
                  }
                  trackColor={{
                    false: theme.colors.border,
                    true: theme.colors.success + "50",
                  }}
                  thumbColor={
                    restaurant.openingHours[day.id as DayOfWeek]?.isOpen
                      ? theme.colors.success
                      : theme.colors.placeholder
                  }
                />
              </View>

              {restaurant.openingHours[day.id as DayOfWeek]?.isOpen && (
                <View style={styles.hoursContainer}>
                  <View style={styles.timeContainer}>
                    <Text
                      style={[
                        styles.timeLabel,
                        { color: theme.colors.darkGray },
                      ]}
                    >
                      Open
                    </Text>
                    <TextInput
                      style={[
                        styles.timeInput,
                        {
                          backgroundColor: theme.colors.gray,
                          color: theme.colors.text,
                        },
                      ]}
                      value={restaurant.openingHours[day.id as DayOfWeek]?.open}
                      onChangeText={(text) =>
                        handleHoursChange(day.id, "open", text)
                      }
                      placeholder="09:00"
                      placeholderTextColor={theme.colors.placeholder}
                    />
                  </View>

                  <Text
                    style={[
                      styles.timeSeparator,
                      { color: theme.colors.darkGray },
                    ]}
                  >
                    to
                  </Text>

                  <View style={styles.timeContainer}>
                    <Text
                      style={[
                        styles.timeLabel,
                        { color: theme.colors.darkGray },
                      ]}
                    >
                      Close
                    </Text>
                    <TextInput
                      style={[
                        styles.timeInput,
                        {
                          backgroundColor: theme.colors.gray,
                          color: theme.colors.text,
                        },
                      ]}
                      value={
                        restaurant.openingHours[day.id as DayOfWeek]?.close
                      }
                      onChangeText={(text) =>
                        handleHoursChange(day.id, "close", text)
                      }
                      placeholder="22:00"
                      placeholderTextColor={theme.colors.placeholder}
                    />
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      );
    };

    // Render Images tab content
    const renderImagesTab = () => (
      <View style={styles.tabContent}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Restaurant Logo
        </Text>
        <View style={styles.imageSection}>
          <View style={styles.imagePreviewContainer}>
            {logoImage ? (
              <Image
                source={{ uri: logoImage }}
                style={styles.logoPreview}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.noImageContainer,
                  { backgroundColor: theme.colors.gray },
                ]}
              >
                <Icon
                  name="image-off"
                  size={40}
                  color={theme.colors.placeholder}
                />
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.imageButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleSelectLogo}
          >
            <Text
              style={[styles.imageButtonText, { color: theme.colors.white }]}
            >
              {logoImage ? "Change Logo" : "Upload Logo"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Cover Image
        </Text>
        <View style={styles.imageSection}>
          <View style={styles.coverPreviewContainer}>
            {coverImage ? (
              <Image
                source={{ uri: coverImage }}
                style={styles.coverPreview}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.noImageContainer,
                  { backgroundColor: theme.colors.gray },
                ]}
              >
                <Icon
                  name="image-off"
                  size={40}
                  color={theme.colors.placeholder}
                />
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.imageButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleSelectCover}
          >
            <Text
              style={[styles.imageButtonText, { color: theme.colors.white }]}
            >
              {coverImage ? "Change Cover" : "Upload Cover"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Gallery Images
        </Text>
        <View style={styles.gallerySection}>
          <View style={styles.galleryGrid}>
            {galleryImages.map((image, index) => (
              <View key={index} style={styles.galleryImageContainer}>
                <Image
                  source={{ uri: image }}
                  style={styles.galleryImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={[
                    styles.removeImageButton,
                    { backgroundColor: theme.colors.error },
                  ]}
                  onPress={() => removeGalleryImage(index)}
                >
                  <Icon name="close" size={16} color={theme.colors.white} />
                </TouchableOpacity>
              </View>
            ))}
            {galleryImages.length < 5 && (
              <TouchableOpacity
                style={[
                  styles.addImageButton,
                  { borderColor: theme.colors.primary },
                ]}
                onPress={handleSelectGalleryImages}
              >
                <Icon name="plus" size={30} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.galleryHelp, { color: theme.colors.darkGray }]}>
            You can add up to 5 gallery images. Tap on an image to remove it.
          </Text>
        </View>
      </View>
    );

    // Render Delivery tab content
    const renderDeliveryTab = () => (
      <View style={styles.tabContent}>
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
            Delivery Fee ($)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.gray,
                color: theme.colors.text,
              },
            ]}
            value={restaurant.deliveryFee?.toString()}
            onChangeText={(text) =>
              handleChange("deliveryFee", parseFloat(text) || 0)
            }
            placeholder="Enter delivery fee"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
            Minimum Order Amount ($)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.gray,
                color: theme.colors.text,
              },
            ]}
            value={restaurant.minOrderAmount?.toString()}
            onChangeText={(text) =>
              handleChange("minOrderAmount", parseFloat(text) || 0)
            }
            placeholder="Enter minimum order amount"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
            Preparation Time (minutes)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.gray,
                color: theme.colors.text,
              },
            ]}
            value={restaurant.preparationTime?.toString()}
            onChangeText={(text) =>
              handleChange("preparationTime", parseInt(text) || 0)
            }
            placeholder="Enter preparation time"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.switchContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
            Offer Delivery
          </Text>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
              {restaurant.offerDelivery ? "Yes" : "No"}
            </Text>
            <Switch
              value={restaurant.offerDelivery}
              onValueChange={(value) => handleChange("offerDelivery", value)}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.success + "50",
              }}
              thumbColor={
                restaurant.offerDelivery
                  ? theme.colors.success
                  : theme.colors.placeholder
              }
            />
          </View>
        </View>

        <View style={styles.switchContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
            Offer Pickup
          </Text>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
              {restaurant.offerPickup ? "Yes" : "No"}
            </Text>
            <Switch
              value={restaurant.offerPickup}
              onValueChange={(value) => handleChange("offerPickup", value)}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.success + "50",
              }}
              thumbColor={
                restaurant.offerPickup
                  ? theme.colors.success
                  : theme.colors.placeholder
              }
            />
          </View>
        </View>
      </View>
    );

    // Render tabs
    const renderContent = () => {
      switch (currentTab) {
        case "general":
          return renderGeneralTab();
        case "hours":
          return renderHoursTab();
        case "images":
          return renderImagesTab();
        case "delivery":
          return renderDeliveryTab();
        default:
          return renderGeneralTab();
      }
    };

    // Render loading state
    if (loading) {
      return (
        <View
          style={[
            styles.loadingContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading restaurant data...
          </Text>
        </View>
      );
    }

    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          <View
            style={[
              styles.container,
              { backgroundColor: theme.colors.background },
            ]}
          >
            {/* Tabs */}
            <View
              style={[
                styles.tabsContainer,
                { borderBottomColor: theme.colors.border },
              ]}
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    currentTab === "general" && [
                      styles.activeTab,
                      { borderBottomColor: theme.colors.primary },
                    ],
                  ]}
                  onPress={() => setCurrentTab("general")}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      {
                        color:
                          currentTab === "general"
                            ? theme.colors.primary
                            : theme.colors.darkGray,
                      },
                    ]}
                  >
                    General
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    currentTab === "hours" && [
                      styles.activeTab,
                      { borderBottomColor: theme.colors.primary },
                    ],
                  ]}
                  onPress={() => setCurrentTab("hours")}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      {
                        color:
                          currentTab === "hours"
                            ? theme.colors.primary
                            : theme.colors.darkGray,
                      },
                    ]}
                  >
                    Opening Hours
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    currentTab === "images" && [
                      styles.activeTab,
                      { borderBottomColor: theme.colors.primary },
                    ],
                  ]}
                  onPress={() => setCurrentTab("images")}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      {
                        color:
                          currentTab === "images"
                            ? theme.colors.primary
                            : theme.colors.darkGray,
                      },
                    ]}
                  >
                    Images
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    currentTab === "delivery" && [
                      styles.activeTab,
                      { borderBottomColor: theme.colors.primary },
                    ],
                  ]}
                  onPress={() => setCurrentTab("delivery")}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      {
                        color:
                          currentTab === "delivery"
                            ? theme.colors.primary
                            : theme.colors.darkGray,
                      },
                    ]}
                  >
                    Delivery
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {renderContent()}

              {/* Error message */}
              {error && (
                <View
                  style={[
                    styles.errorContainer,
                    { backgroundColor: "rgba(255, 0, 0, 0.1)" },
                  ]}
                >
                  <Icon
                    name="alert-circle"
                    size={20}
                    color={theme.colors.error}
                  />
                  <Text
                    style={[styles.errorText, { color: theme.colors.error }]}
                  >
                    {error}
                  </Text>
                </View>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: saving
                      ? theme.colors.gray
                      : theme.colors.primary,
                  },
                ]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={theme.colors.white} size="small" />
                ) : (
                  <Text
                    style={[
                      styles.saveButtonText,
                      { color: theme.colors.white },
                    ]}
                  >
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>

              {/* Bottom spacing */}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
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
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
    },
    tabsContainer: {
      borderBottomWidth: 1,
    },
    tabButton: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    activeTab: {
      borderBottomWidth: 2,
    },
    tabButtonText: {
      fontSize: 14,
      fontWeight: "500",
    },
    scrollContent: {
      padding: 16,
    },
    tabContent: {
      paddingBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 16,
      marginTop: 8,
    },
    inputContainer: {
      marginBottom: 20,
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
    },
    textArea: {
      minHeight: 100,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingTop: 12,
      fontSize: 16,
    },
    switchContainer: {
      marginBottom: 20,
    },
    switchRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
    },
    switchLabel: {
      fontSize: 16,
    },
    hoursRow: {
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(0,0,0,0.05)",
      paddingBottom: 16,
    },
    dayContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    dayLabel: {
      fontSize: 16,
      fontWeight: "500",
    },
    hoursContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    timeContainer: {
      flex: 2,
    },
    timeLabel: {
      fontSize: 12,
      marginBottom: 4,
    },
    timeInput: {
      height: 40,
      borderRadius: 8,
      paddingHorizontal: 12,
      fontSize: 14,
    },
    timeSeparator: {
      flex: 1,
      textAlign: "center",
      fontSize: 14,
    },
    imageSection: {
      marginBottom: 24,
      alignItems: "center",
    },
    imagePreviewContainer: {
      marginBottom: 16,
    },
    logoPreview: {
      width: 120,
      height: 120,
      borderRadius: 60,
    },
    coverPreviewContainer: {
      width: "100%",
      marginBottom: 16,
    },
    coverPreview: {
      width: "100%",
      height: 150,
      borderRadius: 8,
    },
    noImageContainer: {
      width: "100%",
      height: 150,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    imageButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    imageButtonText: {
      fontSize: 14,
      fontWeight: "500",
    },
    gallerySection: {
      marginBottom: 24,
    },
    galleryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "flex-start",
      marginBottom: 8,
    },
    galleryImageContainer: {
      width: "30%",
      aspectRatio: 1,
      margin: "1.66%",
      position: "relative",
    },
    galleryImage: {
      width: "100%",
      height: "100%",
      borderRadius: 8,
    },
    removeImageButton: {
      position: "absolute",
      top: -8,
      right: -8,
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    addImageButton: {
      width: "30%",
      aspectRatio: 1,
      margin: "1.66%",
      borderWidth: 1,
      borderStyle: "dashed",
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    galleryHelp: {
      fontSize: 12,
      marginTop: 8,
    },
    errorContainer: {
      padding: 12,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    errorText: {
      marginLeft: 8,
      fontSize: 14,
      flex: 1,
    },
    saveButton: {
      height: 50,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 16,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: "bold",
    },
  });
};
export default EditRestaurantProfileScreen;
