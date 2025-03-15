import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "../contexts/LocationContext";
import { launchImageLibrary } from "react-native-image-picker";

const DeliveryProfileScreen = ({ navigation }: any) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, logout, updateProfile } = useAuth();
  const { currentLocation, stopWatchingPosition } = useLocation();

  // State
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [statistics, setStatistics] = useState({
    totalDeliveries: 0,
    todayDeliveries: 0,
    weeklyEarnings: 0,
    rating: 0,
    acceptanceRate: 0,
  });

  // Load statistics
  useEffect(() => {
    // In a real app, you would fetch this data from an API
    // For now, we'll use mock data
    setStatistics({
      totalDeliveries: 248,
      todayDeliveries: 7,
      weeklyEarnings: 543.75,
      rating: 4.8,
      acceptanceRate: 92,
    });
  }, []);

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

      // In a real app, you would call an API to upload the image
      // await userService.uploadAvatar(imageUri);

      // For demo, we'll simulate a successful upload
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update user profile with new avatar
      await updateProfile({ avatar: imageUri });

      Alert.alert("Success", "Profile image updated successfully");
    } catch (error) {
      console.error("Upload avatar error:", error);
      Alert.alert("Error", "Failed to upload profile image");
    } finally {
      setAvatarLoading(false);
    }
  };

  // Handle online/offline toggle
  const handleOnlineToggle = (value: any) => {
    if (!value) {
      // Going offline
      Alert.alert(
        "Go Offline",
        "Are you sure you want to go offline? You will not receive new delivery requests.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go Offline",
            style: "destructive",
            onPress: () => {
              setIsOnline(false);
              stopWatchingPosition();
            },
          },
        ]
      );
    } else {
      // Going online
      setIsOnline(true);
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

  // Navigate to edit profile
  const navigateToEditProfile = () => {
    navigation.navigate("Profile");
  };

  // Render statistics cards
  const renderStatistics = () => (
    <View style={styles.statsContainer}>
      <View style={[styles.statsCard, { backgroundColor: theme.colors.card }]}>
        <View style={styles.statsHeader}>
          <Icon name="bike-fast" size={20} color={theme.colors.primary} />
          <Text style={[styles.statsTitle, { color: theme.colors.text }]}>
            Today's Deliveries
          </Text>
        </View>
        <Text style={[styles.statsValue, { color: theme.colors.text }]}>
          {statistics.todayDeliveries}
        </Text>
      </View>

      <View style={[styles.statsCard, { backgroundColor: theme.colors.card }]}>
        <View style={styles.statsHeader}>
          <Icon name="cash" size={20} color={theme.colors.success} />
          <Text style={[styles.statsTitle, { color: theme.colors.text }]}>
            Weekly Earnings
          </Text>
        </View>
        <Text style={[styles.statsValue, { color: theme.colors.text }]}>
          ${statistics.weeklyEarnings.toFixed(2)}
        </Text>
      </View>

      <View style={[styles.statsCard, { backgroundColor: theme.colors.card }]}>
        <View style={styles.statsHeader}>
          <Icon name="star" size={20} color={theme.colors.warning} />
          <Text style={[styles.statsTitle, { color: theme.colors.text }]}>
            Rating
          </Text>
        </View>
        <Text style={[styles.statsValue, { color: theme.colors.text }]}>
          {statistics.rating.toFixed(1)}
        </Text>
      </View>

      <View style={[styles.statsCard, { backgroundColor: theme.colors.card }]}>
        <View style={styles.statsHeader}>
          <Icon name="check-circle" size={20} color={theme.colors.info} />
          <Text style={[styles.statsTitle, { color: theme.colors.text }]}>
            Acceptance Rate
          </Text>
        </View>
        <Text style={[styles.statsValue, { color: theme.colors.text }]}>
          {statistics.acceptanceRate}%
        </Text>
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
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {/* Profile Image */}
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleSelectProfileImage}
            disabled={avatarLoading}
          >
            {avatarLoading ? (
              <View
                style={[styles.avatar, { backgroundColor: theme.colors.gray }]}
              >
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

          {/* Profile Name and Status */}
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.colors.text }]}>
              {user?.name || "Delivery Driver"}
            </Text>
            <View style={styles.profileStatus}>
              <View
                style={[
                  styles.statusIndicator,
                  {
                    backgroundColor: isOnline
                      ? theme.colors.success
                      : theme.colors.error,
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  {
                    color: isOnline ? theme.colors.success : theme.colors.error,
                  },
                ]}
              >
                {isOnline ? "Online" : "Offline"}
              </Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={[
              styles.editButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={navigateToEditProfile}
          >
            <Icon name="account-edit" size={16} color={theme.colors.white} />
            <Text
              style={[styles.editButtonText, { color: theme.colors.white }]}
            >
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* Statistics */}
        {renderStatistics()}

        {/* Settings */}
        <View style={styles.settingsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Settings
          </Text>

          {/* Online/Offline Toggle */}
          <View
            style={[
              styles.settingItem,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <View style={styles.settingInfo}>
              <Icon name="power" size={22} color={theme.colors.primary} />
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                {isOnline ? "Go Offline" : "Go Online"}
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={handleOnlineToggle}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.success + "50",
              }}
              thumbColor={isOnline ? theme.colors.success : theme.colors.error}
            />
          </View>

          {/* Availability Toggle */}
          <View
            style={[
              styles.settingItem,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <View style={styles.settingInfo}>
              <Icon name="bell" size={22} color={theme.colors.primary} />
              <View>
                <Text
                  style={[styles.settingTitle, { color: theme.colors.text }]}
                >
                  Available for Deliveries
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: theme.colors.darkGray },
                  ]}
                >
                  {isAvailable
                    ? "You will receive new delivery requests"
                    : "You will not receive new delivery requests"}
                </Text>
              </View>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary + "50",
              }}
              thumbColor={
                isAvailable ? theme.colors.primary : theme.colors.darkGray
              }
              disabled={!isOnline}
            />
          </View>

          {/* Vehicle Information */}
          <TouchableOpacity
            style={[
              styles.settingItem,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <View style={styles.settingInfo}>
              <Icon name="motorbike" size={22} color={theme.colors.primary} />
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                Vehicle Information
              </Text>
            </View>
            <Icon
              name="chevron-right"
              size={22}
              color={theme.colors.darkGray}
            />
          </TouchableOpacity>

          {/* Dark Mode Toggle */}
          <View
            style={[
              styles.settingItem,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <View style={styles.settingInfo}>
              <Icon
                name="theme-light-dark"
                size={22}
                color={theme.colors.primary}
              />
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                Dark Mode
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary + "50",
              }}
              thumbColor={isDark ? theme.colors.primary : theme.colors.darkGray}
            />
          </View>

          {/* Notifications */}
          <TouchableOpacity
            style={[
              styles.settingItem,
              { borderBottomColor: theme.colors.border },
            ]}
            onPress={() => navigation.navigate("Notifications")}
          >
            <View style={styles.settingInfo}>
              <Icon
                name="bell-outline"
                size={22}
                color={theme.colors.primary}
              />
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                Notifications
              </Text>
            </View>
            <Icon
              name="chevron-right"
              size={22}
              color={theme.colors.darkGray}
            />
          </TouchableOpacity>

          {/* Support */}
          <TouchableOpacity
            style={[
              styles.settingItem,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <View style={styles.settingInfo}>
              <Icon
                name="help-circle-outline"
                size={22}
                color={theme.colors.primary}
              />
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                Support
              </Text>
            </View>
            <Icon
              name="chevron-right"
              size={22}
              color={theme.colors.darkGray}
            />
          </TouchableOpacity>

          {/* About */}
          <TouchableOpacity
            style={[
              styles.settingItem,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <View style={styles.settingInfo}>
              <Icon
                name="information-outline"
                size={22}
                color={theme.colors.primary}
              />
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                About
              </Text>
            </View>
            <Icon
              name="chevron-right"
              size={22}
              color={theme.colors.darkGray}
            />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
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

        {/* App Version */}
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
    paddingVertical: 20,
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
  profileInfo: {
    alignItems: "center",
    marginBottom: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  profileStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
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
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 16,
  },
  statsCard: {
    width: "48%",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statsTitle: {
    fontSize: 12,
    marginLeft: 8,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  settingsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    marginLeft: 12,
  },
  settingDescription: {
    fontSize: 12,
    marginLeft: 12,
    marginTop: 2,
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

export default DeliveryProfileScreen;
