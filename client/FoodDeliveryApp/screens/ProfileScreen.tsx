import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  GestureResponderEvent,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { launchImageLibrary } from "react-native-image-picker";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { userService } from "../api/userService";

const ProfileScreen = ({ navigation }: any) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, logout, updateProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Profile sections data
  const accountItems = [
    {
      icon: "account-edit",
      title: "Edit Profile",
      description: "Change your name, email, and phone",
      onPress: () => navigation.navigate("EditProfile"),
    },
    {
      icon: "map-marker",
      title: "My Addresses",
      description: "Manage your delivery addresses",
      onPress: () => navigation.navigate("AddressList"),
    },
    {
      icon: "credit-card",
      title: "Payment Methods",
      description: "Manage your payment options",
      onPress: () => navigation.navigate("PaymentMethods"),
    },
    {
      icon: "heart",
      title: "Favorites",
      description: "View your favorite restaurants",
      onPress: () => navigation.navigate("Favorites"),
    },
  ];

  const preferencesItems = [
    {
      icon: "bell",
      title: "Notifications",
      description: "Manage your notification preferences",
      onPress: () => navigation.navigate("Notifications"),
    },
    {
      icon: "theme-light-dark",
      title: "Dark Mode",
      isSwitch: true,
      value: isDark,
      onValueChange: toggleTheme,
    },
    {
      icon: "translate",
      title: "Language",
      description: "English",
      onPress: () =>
        Alert.alert("Coming Soon", "Language options will be available soon!"),
    },
  ];

  const supportItems = [
    {
      icon: "help-circle",
      title: "Help & Support",
      description: "Get help with your orders",
      onPress: () =>
        Alert.alert("Support", "Contact support at support@fooddelivery.com"),
    },
    {
      icon: "information",
      title: "About Us",
      description: "Learn more about Food Delivery",
      onPress: () => Alert.alert("About", "Food Delivery App - Version 1.0.0"),
    },
    {
      icon: "shield",
      title: "Privacy Policy",
      onPress: () =>
        Alert.alert(
          "Privacy Policy",
          "Our privacy policy information will be shown here."
        ),
    },
    {
      icon: "file-document",
      title: "Terms & Conditions",
      onPress: () =>
        Alert.alert(
          "Terms & Conditions",
          "Our terms and conditions will be shown here."
        ),
    },
  ];

  // Handle profile image selection
  const handleSelectProfileImage = async () => {
    try {
      const options = {
        mediaType: "photo",
        includeBase64: false,
        maxHeight: 800,
        maxWidth: 800,
      };

      const result = await launchImageLibrary(options as any);

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert("Error", result.errorMessage);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        uploadProfileImage(selectedImage.uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to open image picker");
    }
  };

  // Upload profile image
  const uploadProfileImage = async (imageUri: string | undefined) => {
    try {
      setAvatarLoading(true);
      const result = await userService.uploadAvatar(imageUri);

      if (result && result.avatar_url) {
        // Update user profile with new avatar
        await updateProfile({ avatar: result.avatar_url });
        Alert.alert("Success", "Profile image updated successfully");
      }
    } catch (error) {
      console.error("Upload avatar error:", error);
      Alert.alert("Error", "Failed to upload profile image");
    } finally {
      setAvatarLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await logout();
          } catch (error) {
            console.error("Logout error:", error);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // Render profile header
  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={handleSelectProfileImage}
        disabled={avatarLoading}
      >
        {avatarLoading ? (
          <View style={[styles.avatar, { backgroundColor: theme.colors.gray }]}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : (
          <>
            <Image
              source={
                user?.avatar
                  ? { uri: user.avatar }
                  : require("../assets/images/default-avatar.png")
              }
              style={styles.avatar}
            />
            <View
              style={[
                styles.editAvatarButton,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Icon name="camera" size={14} color={theme.colors.white} />
            </View>
          </>
        )}
      </TouchableOpacity>

      <Text style={[styles.profileName, { color: theme.colors.text }]}>
        {user?.name || "User"}
      </Text>
      <Text style={[styles.profileEmail, { color: theme.colors.darkGray }]}>
        {user?.email || "email@example.com"}
      </Text>

      <TouchableOpacity
        style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate("EditProfile")}
      >
        <Icon name="account-edit" size={16} color={theme.colors.white} />
        <Text style={[styles.editButtonText, { color: theme.colors.white }]}>
          Edit Profile
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render a settings section
  const renderSection = (
    title:
      | string
      | number
      | boolean
      | React.ReactElement<any, string | React.JSXElementConstructor<any>>
      | Iterable<React.ReactNode>
      | null
      | undefined,
    items: any[]
  ) => (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.darkGray }]}>
        {title}
      </Text>
      <View
        style={[styles.sectionContent, { backgroundColor: theme.colors.card }]}
      >
        {items.map(
          (
            item: {
              onPress: ((event: GestureResponderEvent) => void) | undefined;
              isSwitch: boolean | undefined;
              icon: string;
              title:
                | string
                | number
                | boolean
                | React.ReactElement<
                    any,
                    string | React.JSXElementConstructor<any>
                  >
                | Iterable<React.ReactNode>
                | React.ReactPortal
                | null
                | undefined;
              description:
                | string
                | number
                | boolean
                | React.ReactElement<
                    any,
                    string | React.JSXElementConstructor<any>
                  >
                | Iterable<React.ReactNode>
                | React.ReactPortal
                | null
                | undefined;
              value: boolean | undefined;
              onValueChange:
                | ((value: boolean) => Promise<void> | void)
                | null
                | undefined;
            },
            index: number
          ) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.sectionItem,
                index < items.length - 1
                  ? {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                    }
                  : null,
              ]}
              onPress={item.onPress}
              disabled={item.isSwitch}
            >
              <View
                style={[
                  styles.itemIconContainer,
                  { backgroundColor: theme.colors.gray },
                ]}
              >
                <Icon name={item.icon} size={20} color={theme.colors.primary} />
              </View>

              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
                  {item.title}
                </Text>
                {item.description && (
                  <Text
                    style={[
                      styles.itemDescription,
                      { color: theme.colors.darkGray },
                    ]}
                  >
                    {item.description}
                  </Text>
                )}
              </View>

              {item.isSwitch ? (
                <Switch
                  value={item.value}
                  onValueChange={item.onValueChange}
                  trackColor={{
                    false: theme.colors.border,
                    true: theme.colors.primary,
                  }}
                  thumbColor={theme.colors.background}
                />
              ) : (
                <Icon
                  name="chevron-right"
                  size={20}
                  color={theme.colors.darkGray}
                />
              )}
            </TouchableOpacity>
          )
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {renderProfileHeader()}

        {renderSection("Account", accountItems)}
        {renderSection("Preferences", preferencesItems)}
        {renderSection("Support", supportItems)}

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.colors.error }]}
          onPress={handleLogout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.white} size="small" />
          ) : (
            <>
              <Icon name="logout" size={18} color={theme.colors.white} />
              <Text style={[styles.logoutText, { color: theme.colors.white }]}>
                Logout
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: theme.colors.darkGray }]}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
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
  profileHeader: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e1e1e1",
    justifyContent: "center",
    alignItems: "center",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 16,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginHorizontal: 16,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  sectionContent: {
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  sectionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 13,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  versionText: {
    fontSize: 12,
  },
});

export default ProfileScreen;
