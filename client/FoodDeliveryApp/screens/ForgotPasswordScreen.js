import React, { useState } from "react";
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

const ForgotPasswordScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { forgotPassword } = useAuth();

  // State
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Handle forgot password
  const handleForgotPassword = async () => {
    Keyboard.dismiss();

    // Validate email
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await forgotPassword(email);
      setSuccess(true);
    } catch (error) {
      console.error("Forgot password error:", error);
      setError("Failed to send password reset email. Please try again.");
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
            <Icon name="lock-question" size={80} color={theme.colors.primary} />
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]}>
            Forgot Password
          </Text>

          <Text style={[styles.subtitle, { color: theme.colors.darkGray }]}>
            Enter your email address and we'll send you a link to reset your
            password
          </Text>

          {success ? (
            <View style={styles.successContainer}>
              <Icon
                name="check-circle"
                size={60}
                color={theme.colors.success}
              />
              <Text style={[styles.successText, { color: theme.colors.text }]}>
                Password reset link sent!
              </Text>
              <Text
                style={[
                  styles.successSubtext,
                  { color: theme.colors.darkGray },
                ]}
              >
                Please check your email and follow the instructions to reset
                your password.
              </Text>
              <TouchableOpacity
                style={[
                  styles.backButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => navigation.navigate("Login")}
              >
                <Text
                  style={[styles.backButtonText, { color: theme.colors.white }]}
                >
                  Back to Login
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Text
                    style={[styles.inputLabel, { color: theme.colors.text }]}
                  >
                    Email
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
                      name="email"
                      size={20}
                      color={theme.colors.darkGray}
                    />
                    <TextInput
                      style={[styles.input, { color: theme.colors.text }]}
                      placeholder="Enter your email"
                      placeholderTextColor={theme.colors.placeholder}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                    />
                  </View>
                  {error && (
                    <Text
                      style={[styles.errorText, { color: theme.colors.error }]}
                    >
                      {error}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={handleForgotPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator
                      color={theme.colors.white}
                      size="small"
                    />
                  ) : (
                    <Text
                      style={[
                        styles.submitButtonText,
                        { color: theme.colors.white },
                      ]}
                    >
                      Send Reset Link
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

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
            </>
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
  },
  submitButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  submitButtonText: {
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
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
});

export default ForgotPasswordScreen;
