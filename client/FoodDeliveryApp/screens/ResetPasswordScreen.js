import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

const ResetPasswordScreen = ({ route, navigation }) => {
  const { token } = route.params || {};
  const { theme } = useTheme();
  const { resetPassword } = useAuth();

  // State
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Validate token exists
  useEffect(() => {
    if (!token) {
      Alert.alert(
        "Invalid Token",
        "The password reset link is invalid or expired. Please request a new password reset.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("ForgotPassword"),
          },
        ]
      );
    }
  }, [token, navigation]);

  // Handle reset password
  const handleResetPassword = async () => {
    Keyboard.dismiss();

    // Validate password
    if (!password) {
      setError("Password is required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await resetPassword(token, password);
      setSuccess(true);
    } catch (error) {
      console.error("Reset password error:", error);
      setError("Failed to reset password. The link may be expired or invalid.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <View style={styles.iconContainer}>
            <Icon name="lock-reset" size={80} color={theme.colors.primary} />
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]}>
            Reset Password
          </Text>

          <Text style={[styles.subtitle, { color: theme.colors.darkGray }]}>
            Enter your new password below
          </Text>

          {success ? (
            <View style={styles.successContainer}>
              <Icon
                name="check-circle"
                size={60}
                color={theme.colors.success}
              />
              <Text style={[styles.successText, { color: theme.colors.text }]}>
                Password Reset Successful!
              </Text>
              <Text
                style={[
                  styles.successSubtext,
                  { color: theme.colors.darkGray },
                ]}
              >
                Your password has been successfully reset. You can now log in
                with your new password.
              </Text>
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => navigation.navigate("Login")}
              >
                <Text
                  style={[
                    styles.loginButtonText,
                    { color: theme.colors.white },
                  ]}
                >
                  Log In
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContainer}>
              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  New Password
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      borderColor: error
                        ? theme.colors.error
                        : theme.colors.border,
                    },
                  ]}
                >
                  <Icon name="lock" size={20} color={theme.colors.darkGray} />
                  <TextInput
                    style={[styles.input, { color: theme.colors.text }]}
                    placeholder="Enter new password"
                    placeholderTextColor={theme.colors.placeholder}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Icon
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color={theme.colors.darkGray}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  Confirm Password
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      borderColor: error
                        ? theme.colors.error
                        : theme.colors.border,
                    },
                  ]}
                >
                  <Icon
                    name="lock-check"
                    size={20}
                    color={theme.colors.darkGray}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.colors.text }]}
                    placeholder="Confirm new password"
                    placeholderTextColor={theme.colors.placeholder}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Icon
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={20}
                      color={theme.colors.darkGray}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {error && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {error}
                </Text>
              )}

              <TouchableOpacity
                style={[
                  styles.resetButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.white} size="small" />
                ) : (
                  <Text
                    style={[
                      styles.resetButtonText,
                      { color: theme.colors.white },
                    ]}
                  >
                    Reset Password
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backToLoginContainer}
                onPress={() => navigation.navigate("Login")}
              >
                <Icon
                  name="arrow-left"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.backToLoginText,
                    { color: theme.colors.primary },
                  ]}
                >
                  Back to Login
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 30,
  },
  formContainer: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  resetButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  backToLoginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  backToLoginText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  successContainer: {
    alignItems: "center",
    padding: 20,
  },
  successText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  loginButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
});

export default ResetPasswordScreen;
