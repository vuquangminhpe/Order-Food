import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
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
import { showMessage } from "react-native-flash-message";

const RegisterScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { register, loading, USER_ROLES } = useAuth();

  // State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accountType, setAccountType] = useState(USER_ROLES.CUSTOMER); // Default to customer
  const [validationErrors, setValidationErrors] = useState({});
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!name) {
      errors.name = "Name is required";
    }

    if (!email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email is invalid";
    }

    if (!phone) {
      errors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(phone.replace(/\D/g, ""))) {
      errors.phone = "Phone number must be 10 digits";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle registration
  const handleRegister = async () => {
    Keyboard.dismiss();

    if (!validateForm()) {
      return;
    }

    try {
      const result = await register({
        name,
        email,
        phone,
        password,
        confirm_password: confirmPassword,
        role: accountType,
      });

      // Show success message
      showMessage({
        message: "Registration successful!",
        description: "Please check your email to verify your account.",
        type: "success",
        duration: 3000,
      });

      // Navigate to email verification screen
      navigation.navigate("VerifyEmail", {
        email,
        token: result.verify_email_token,
      });
    } catch (error) {
      let errorMessage = "Registration failed. Please try again.";

      if (error.message) {
        errorMessage = error.message;
      } else if (error.errors) {
        // Handle validation errors from backend
        const firstError = Object.values(error.errors)[0];
        if (firstError && firstError.msg) {
          errorMessage = firstError.msg;
        }
      }

      Alert.alert("Registration Failed", errorMessage);
    }
  };

  // Account type options
  const accountTypes = [
    { id: USER_ROLES.CUSTOMER, label: "Customer", icon: "account" },
    {
      id: USER_ROLES.RESTAURANT_OWNER,
      label: "Restaurant Owner",
      icon: "store",
    },
    { id: USER_ROLES.DELIVERY_PERSON, label: "Delivery Person", icon: "bike" },
  ];

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { backgroundColor: theme.colors.background },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={[styles.headerText, { color: theme.colors.text }]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.darkGray }]}>
              Sign up to enjoy delicious food delivered to your doorstep
            </Text>
          </View>

          {/* Account Type Selection */}
          <View style={styles.accountTypeContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              I am a:
            </Text>
            <View style={styles.accountTypeOptions}>
              {accountTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.accountTypeOption,
                    accountType === type.id && {
                      backgroundColor: theme.colors.highlight,
                      borderColor: theme.colors.primary,
                    },
                    accountType !== type.id && {
                      backgroundColor: theme.colors.gray,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => setAccountType(type.id)}
                >
                  <Icon
                    name={type.icon}
                    size={24}
                    color={
                      accountType === type.id
                        ? theme.colors.primary
                        : theme.colors.darkGray
                    }
                  />
                  <Text
                    style={[
                      styles.accountTypeLabel,
                      {
                        color:
                          accountType === type.id
                            ? theme.colors.primary
                            : theme.colors.text,
                      },
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Registration Form */}
          <View style={styles.formContainer}>
            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                Full Name
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  validationErrors.name
                    ? { borderColor: theme.colors.error }
                    : { borderColor: theme.colors.border },
                ]}
              >
                <Icon name="account" size={20} color={theme.colors.darkGray} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.colors.placeholder}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>
              {validationErrors.name && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {validationErrors.name}
                </Text>
              )}
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                Email
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  validationErrors.email
                    ? { borderColor: theme.colors.error }
                    : { borderColor: theme.colors.border },
                ]}
              >
                <Icon name="email" size={20} color={theme.colors.darkGray} />
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
              {validationErrors.email && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {validationErrors.email}
                </Text>
              )}
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                Phone Number
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  validationErrors.phone
                    ? { borderColor: theme.colors.error }
                    : { borderColor: theme.colors.border },
                ]}
              >
                <Icon name="phone" size={20} color={theme.colors.darkGray} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Enter your phone number"
                  placeholderTextColor={theme.colors.placeholder}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              </View>
              {validationErrors.phone && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {validationErrors.phone}
                </Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                Password
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  validationErrors.password
                    ? { borderColor: theme.colors.error }
                    : { borderColor: theme.colors.border },
                ]}
              >
                <Icon name="lock" size={20} color={theme.colors.darkGray} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.colors.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
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
              {validationErrors.password && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {validationErrors.password}
                </Text>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                Confirm Password
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  validationErrors.confirmPassword
                    ? { borderColor: theme.colors.error }
                    : { borderColor: theme.colors.border },
                ]}
              >
                <Icon
                  name="lock-check"
                  size={20}
                  color={theme.colors.darkGray}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Confirm your password"
                  placeholderTextColor={theme.colors.placeholder}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
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
              {validationErrors.confirmPassword && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {validationErrors.confirmPassword}
                </Text>
              )}
            </View>

            {/* Terms Agreement */}
            <View style={styles.termsContainer}>
              <Text
                style={[styles.termsText, { color: theme.colors.darkGray }]}
              >
                By signing up, you agree to our{" "}
                <Text
                  style={[styles.termsLink, { color: theme.colors.primary }]}
                >
                  Terms of Service
                </Text>{" "}
                and{" "}
                <Text
                  style={[styles.termsLink, { color: theme.colors.primary }]}
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[
                styles.registerButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} size="small" />
              ) : (
                <Text
                  style={[
                    styles.registerButtonText,
                    { color: theme.colors.white },
                  ]}
                >
                  Sign Up
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: theme.colors.darkGray }]}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={[styles.loginLink, { color: theme.colors.primary }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  headerContainer: {
    marginTop: 40,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
  },
  accountTypeContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
  },
  accountTypeOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  accountTypeOption: {
    width: "31%",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  accountTypeLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
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
  termsContainer: {
    marginVertical: 16,
  },
  termsText: {
    fontSize: 12,
    lineHeight: 18,
  },
  termsLink: {
    fontSize: 12,
    fontWeight: "500",
  },
  registerButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  loginText: {
    fontSize: 14,
    marginRight: 5,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default RegisterScreen;
