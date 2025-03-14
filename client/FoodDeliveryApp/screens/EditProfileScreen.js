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
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { launchImageLibrary } from "react-native-image-picker";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { userService } from "../../api/userService";
import FormInput from "../../components/general/FormInput";
import Button from "../../components/general/Button";
import DatePicker from "../../components/general/DatePicker";

const EditProfileScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, updateProfile } = useAuth();

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [avatarSource, setAvatarSource] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState(null);
  const [nameError, setNameError] = useState(null);
  const [phoneError, setPhoneError] = useState(null);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setDateOfBirth(user.date_of_birth ? new Date(user.date_of_birth) : null);
      setAvatarSource(user.avatar || null);
    }
  }, [user]);

  // Handle selecting image from gallery
  const handleSelectImage = () => {
    const options = {
      mediaType: "photo",
      includeBase64: false,
      maxHeight: 800,
      maxWidth: 800,
    };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        console.error("ImagePicker Error: ", response.errorMessage);
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const source = response.assets[0].uri;
        setAvatarSource(source);
        setAvatar(source);

        // Upload avatar immediately
        try {
          setUploadingImage(true);
          const result = await userService.uploadAvatar(source);
          // Update avatar URL with the one from server
          setAvatarSource(result.avatar_url);
          setUploadingImage(false);
        } catch (error) {
          setUploadingImage(false);
          Alert.alert("Error", "Failed to upload avatar. Please try again.");
        }
      }
    });
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

  // Handle form submission
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

      await updateProfile(profileData);

      Alert.alert("Success", "Profile updated successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error("Update profile error:", err);
      setError("Failed to update profile. Please try again.");
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
                <Icon
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
            >
              <Icon name="camera" size={16} color={theme.colors.white} />
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
                <Icon
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
