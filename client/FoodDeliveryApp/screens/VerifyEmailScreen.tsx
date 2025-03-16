import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

const VerifyEmailScreen = ({ route, navigation }: any) => {
  const { email, token } = route.params || {};
  const { theme } = useTheme();
  const { verifyEmail } = useAuth();

  // State
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-verify if token is provided
  useEffect(() => {
    if (token) {
      handleVerifyEmail();
    }
  }, [token]);

  // Handle verify email
  const handleVerifyEmail = async () => {
    if (!token) {
      setError("Verification token is missing.");
      return;
    }

    try {
      setVerifying(true);
      setError(null);

      const result = await verifyEmail(token);

      if (result && result.success) {
        setVerified(true);
      } else {
        setError(
          "Email verification failed. The link may be invalid or expired."
        );
      }
    } catch (error) {
      console.error("Verify email error:", error);
      setError("Failed to verify email. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  // Handle resend verification email
  const handleResendEmail = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real app, would call an API to resend verification email
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call

      Alert.alert(
        "Verification Email Sent",
        `A new verification email has been sent to ${email}.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Resend verification error:", error);
      setError("Failed to resend verification email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Render content based on verification state
  const renderContent = () => {
    if (verifying) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.statusText, { color: theme.colors.text }]}>
            Verifying your email...
          </Text>
        </View>
      );
    }

    if (verified) {
      return (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons
            name="check-circle"
            size={80}
            color={theme.colors.success}
          />
          <Text style={[styles.statusTitle, { color: theme.colors.text }]}>
            Email Verified!
          </Text>
          <Text style={[styles.statusText, { color: theme.colors.darkGray }]}>
            Your email has been successfully verified. You can now log in to
            your account.
          </Text>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => navigation.navigate("Login")}
          >
            <Text
              style={[styles.primaryButtonText, { color: theme.colors.white }]}
            >
              Proceed to Login
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        <MaterialCommunityIcons
          name="email-check"
          size={80}
          color={theme.colors.primary}
        />
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Verify Your Email
        </Text>
        <Text style={[styles.message, { color: theme.colors.darkGray }]}>
          We've sent a verification link to{" "}
          <Text style={{ fontWeight: "bold" }}>{email}</Text>. Please check your
          inbox and click the link to verify your email address.
        </Text>

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

        <View style={styles.instructionsContainer}>
          <Text
            style={[styles.instructionsTitle, { color: theme.colors.text }]}
          >
            Didn't receive the email?
          </Text>
          <Text
            style={[styles.instructionsText, { color: theme.colors.darkGray }]}
          >
            • Check your spam or junk folder{"\n"}• Verify you entered the
            correct email address{"\n"}• Wait a few minutes and check again
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.resendButton, { borderColor: theme.colors.primary }]}
          onPress={handleResendEmail}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text
              style={[styles.resendButtonText, { color: theme.colors.primary }]}
            >
              Resend Verification Email
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backToLoginContainer}
          onPress={() => navigation.navigate("Login")}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={16}
            color={theme.colors.primary}
          />
          <Text
            style={[styles.backToLoginText, { color: theme.colors.primary }]}
          >
            Back to Login
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: "100%",
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  instructionsContainer: {
    width: "100%",
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 22,
  },
  resendButton: {
    width: "100%",
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  backToLoginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  backToLoginText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 20,
    lineHeight: 24,
    maxWidth: "80%",
  },
  primaryButton: {
    width: "100%",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default VerifyEmailScreen;
