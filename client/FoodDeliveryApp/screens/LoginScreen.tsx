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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth, USER_ROLES } from "../contexts/AuthContext";
import { showMessage } from "react-native-flash-message";
import authService from "@/api/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";

const LoginScreen = ({ navigation, route }: any) => {
  const { theme } = useTheme();
  const { setUser, login, loading, setLoading, navigateByRole } = useAuth();

  // State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Check for redirect message
  useEffect(() => {
    if (route.params?.message) {
      showMessage({
        message: route.params.message,
        type: route.params.status || "info",
        duration: 3000,
      });
    }
  }, [route.params]);

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
    const errors = {} as any;

    if (!email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email is invalid";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle login
  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }
    const result = await authService.login(email, password);

    try {
      setLoading(true);
      setError(null);

      if (result && result.result) {
        const response = result.result;

        await storeUserSession(response.access_token, response.refresh_token);
        setUser(response.user);
        navigateByRole(navigation, response.user.role);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error: any) {
      console.error("Login error:", error, result);

      if (error.response && error.response.status === 401) {
        setError("Email hoặc mật khẩu không chính xác.");
      } else if (error.request) {
        setError(
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet."
        );
      } else {
        setError("Đăng nhập thất bại. Vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  };

  const storeUserSession = async (
    accessToken: string,
    refreshToken: string
  ) => {
    await AsyncStorage.setItem("accessToken", accessToken);
    await AsyncStorage.setItem("refreshToken", refreshToken);
  };

  // Navigate to register screen
  const handleRegister = () => {
    navigation.navigate("Register");
  };

  // Navigate to forgot password screen
  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

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
          {/* Logo and Welcome Text */}
          <View style={styles.headerContainer}>
            <Image
              source={require("../assets/images/logo.webp")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.welcomeText, { color: theme.colors.text }]}>
              Welcome Back!
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.darkGray }]}>
              Sign in to continue ordering your favorite food
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                Email
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  (validationErrors as any).email
                    ? { borderColor: theme.colors.error }
                    : { borderColor: theme.colors.border },
                ]}
              >
                <MaterialCommunityIcons
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
              {(validationErrors as any).email && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {(validationErrors as any).email}
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
                  (validationErrors as any).password
                    ? { borderColor: theme.colors.error }
                    : { borderColor: theme.colors.border },
                ]}
              >
                <MaterialCommunityIcons
                  name="lock"
                  size={20}
                  color={theme.colors.darkGray}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.colors.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color={theme.colors.darkGray}
                  />
                </TouchableOpacity>
              </View>
              {(validationErrors as any).password && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {(validationErrors as any).password}
                </Text>
              )}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={handleForgotPassword}
            >
              <Text
                style={[
                  styles.forgotPasswordText,
                  { color: theme.colors.primary },
                ]}
              >
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} size="small" />
              ) : (
                <Text
                  style={[
                    styles.loginButtonText,
                    { color: theme.colors.white },
                  ]}
                >
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            {/* Or Divider */}
            <View style={styles.dividerContainer}>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.colors.border },
                ]}
              />
              <Text
                style={[styles.dividerText, { color: theme.colors.darkGray }]}
              >
                or
              </Text>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.colors.border },
                ]}
              />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.socialButton,
                  { backgroundColor: theme.colors.gray },
                ]}
              >
                <MaterialCommunityIcons
                  name="google"
                  size={20}
                  color="#DB4437"
                />
                <Text
                  style={[
                    styles.socialButtonText,
                    { color: theme.colors.text },
                  ]}
                >
                  Google
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.socialButton,
                  { backgroundColor: theme.colors.gray },
                ]}
              >
                <MaterialCommunityIcons
                  name="facebook"
                  size={20}
                  color="#4267B2"
                />
                <Text
                  style={[
                    styles.socialButtonText,
                    { color: theme.colors.text },
                  ]}
                >
                  Facebook
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text
              style={[styles.registerText, { color: theme.colors.darkGray }]}
            >
              Don't have an account?
            </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text
                style={[styles.registerLink, { color: theme.colors.primary }]}
              >
                Sign Up
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
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    marginBottom: 20,
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
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  loginButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 5,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
    marginRight: 5,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default LoginScreen;
