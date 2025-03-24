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
  Platform,
  KeyboardAvoidingView,
  Alert,
  SafeAreaView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { userService } from "../api/userService";
import FormInput from "../components/general/FormInput";
import Button from "../components/general/Button";
import DatePicker from "../components/general/DatePicker";

const EditProfileScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { user, updateProfile } = useAuth();

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [avatarSource, setAvatarSource] = useState<string | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setDateOfBirth(user.date_of_birth ? new Date(user.date_of_birth) : null);
      setAvatarSource(user.avatar as any);
    }
  }, [user]);

  // Handle selecting image from gallery with improved error handling
  const handleSelectImage = async () => {
    try {
      // Request permissions first
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera roll permissions to upload a profile picture"
        );
        return;
      }

      // Launch the image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const selectedAsset = result.assets[0];
        const imageUri = selectedAsset.uri;
        setAvatarSource(imageUri);

        // Upload the selected image
        if (imageUri) {
          await uploadAvatar(imageUri);
        }
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to open image picker");
    }
  };

  // Upload avatar with improved implementation
  const uploadAvatar = async (imageUri: string) => {
    try {
      console.log("Starting avatar upload with URI:", imageUri);

      // Prepare the file info properly for FormData
      const filename = imageUri.split("/").pop() || "photo.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1].toLowerCase()}` : "image/jpeg";

      console.log("Preparing form data with:", {
        uri: imageUri,
        name: filename,
        type,
      });

      const formData = new FormData();
      // This is the critical part - properly format the file object for FormData
      formData.append("avatar", {
        uri:
          Platform.OS === "android"
            ? imageUri
            : imageUri.replace("file://", ""),
        type: type,
        name: filename,
      } as any);

      const result = await userService.uploadAvatar(imageUri);
      console.log("Upload result:", result);

      if (result && (result.avatar_url || result.avatar)) {
        const avatarUrl = result.avatar_url || result.avatar;
        setAvatarSource(avatarUrl);
        // Update profile
        await updateProfile({ avatar: avatarUrl });
        Alert.alert("Success", "Profile image updated successfully");
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("Upload avatar error:", JSON.stringify(error));
      Alert.alert("Error", "Failed to upload profile image. Please try again.");
    } finally {
    }
  };

  // Validate form
  const validateForm = () => {
    let isValid = true;

    // Validate name
    if (!name.trim()) {
      setNameError("Name is required");
      isValid = false;
    } else {
      setNameError(null);
    }

    // Validate phone
    if (phone.trim() && !/^[0-9+\-\s()]{7,15}$/.test(phone.trim())) {
      setPhoneError("Please enter a valid phone number");
      isValid = false;
    } else {
      setPhoneError(null);
    }

    return isValid;
  };

  // Handle form submission with improved error handling
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const profileData = {
        name: name.trim(),
        phone: phone.trim(),
        date_of_birth: dateOfBirth
          ? dateOfBirth.toISOString().split("T")[0]
          : undefined,
      };

      console.log("Updating profile with data:", profileData);

      // Update the profile on the server
      const result = await userService.updateProfile(profileData);

      console.log("Profile update result:", result);

      // Update the local user data
      await updateProfile(profileData);

      Alert.alert("Success", "Profile updated successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error("Update profile error:", err);
      setError("Failed to update profile. Please try again.");
      Alert.alert("Error", "Failed to update profile. Please try again.");
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
          {/* Avatar Section */}
          <View style={styles.avatarContainer}>
            {uploadingImage ? (
              <View
                style={[styles.avatar, { backgroundColor: theme.colors.gray }]}
              >
                <ActivityIndicator color={theme.colors.primary} size="small" />
              </View>
            ) : avatarSource ? (
              <Image source={{ uri: avatarSource }} style={styles.avatar} />
            ) : (
              <View
                style={[styles.avatar, { backgroundColor: theme.colors.gray }]}
              >
                <MaterialCommunityIcons
                  name="account"
                  size={40}
                  color={theme.colors.placeholder}
                />
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.editAvatarButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleSelectImage}
              disabled={uploadingImage}
            >
              <MaterialCommunityIcons
                name="camera"
                size={16}
                color={theme.colors.white}
              />
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <FormInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              error={nameError}
              icon="account"
              autoCapitalize="words"
            />

            <FormInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              error={phoneError}
              icon="phone"
              keyboardType="phone-pad"
            />

            <DatePicker
              label="Date of Birth"
              value={dateOfBirth}
              onChange={setDateOfBirth}
              placeholder="Select your date of birth"
              icon="calendar"
            />

            {/* Error Message */}
            {error && (
              <View
                style={[
                  styles.errorContainer,
                  { backgroundColor: "rgba(255, 0, 0, 0.1)" },
                ]}
              >
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={20}
                  color={theme.colors.error}
                />
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {error}
                </Text>
              </View>
            )}

            {/* Save Button */}
            <Button
              title="Save Changes"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading || uploadingImage}
              style={styles.saveButton}
            />
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
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  avatarContainer: {
    alignItems: "center",
    marginVertical: 20,
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  editAvatarButton: {
    position: "absolute",
    right: "35%",
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    marginTop: 20,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  saveButton: {
    marginTop: 24,
  },
});

export default EditProfileScreen;
