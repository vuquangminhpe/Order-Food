import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Switch,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

const PaymentMethodsScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  // State
  interface PaymentMethod {
    id: string;
    type: string;
    cardholderName: string;
    cardNumber: string;
    cardBrand: string;
    expiryDate: string;
    isDefault: boolean;
  }

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState(null);

  // Form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real app, you would call an API to get payment methods
      // For demonstration, we'll use mock data
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockPaymentMethods = [
        {
          id: "1",
          type: "credit_card",
          cardholderName: "John Doe",
          cardNumber: "•••• •••• •••• 4242",
          cardBrand: "Visa",
          expiryDate: "12/24",
          isDefault: true,
        },
        {
          id: "2",
          type: "credit_card",
          cardholderName: "John Doe",
          cardNumber: "•••• •••• •••• 5555",
          cardBrand: "Mastercard",
          expiryDate: "10/25",
          isDefault: false,
        },
      ];

      setPaymentMethods(mockPaymentMethods as any);
    } catch (err) {
      console.error("Error fetching payment methods:", err);
      setError("Failed to load payment methods. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  // Open add/edit payment method modal
  const openPaymentMethodModal = (paymentMethod: any) => {
    if (paymentMethod) {
      // Edit mode - would need to fetch full card details in a real app
      setEditingPaymentMethod(paymentMethod);
      setCardNumber(""); // For security, don't prefill card number
      setCardholderName(paymentMethod.cardholderName);
      setExpiryDate(paymentMethod.expiryDate);
      setCvv(""); // For security, don't prefill CVV
      setIsDefault(paymentMethod.isDefault);
    } else {
      // Add mode
      setEditingPaymentMethod(null);
      setCardNumber("");
      setCardholderName("");
      setExpiryDate("");
      setCvv("");
      setIsDefault(false);
    }

    setFormErrors({});
    setModalVisible(true);
  };

  // Format card number with spaces
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
    return formatted.substr(0, 19); // limit to 16 digits (plus spaces)
  };

  // Format expiry date (MM/YY)
  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\//g, "").replace(/[^0-9]/gi, "");

    if (cleaned.length > 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }

    return cleaned;
  };

  // Validate form
  const validateForm = () => {
    const errors = {} as any;

    if (!cardNumber.trim()) {
      errors.cardNumber = "Card number is required";
    } else if (cardNumber.replace(/\s+/g, "").length < 16) {
      errors.cardNumber = "Invalid card number";
    }

    if (!cardholderName.trim()) {
      errors.cardholderName = "Cardholder name is required";
    }

    if (!expiryDate.trim()) {
      errors.expiryDate = "Expiry date is required";
    } else {
      const [month, year] = expiryDate.split("/");
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;

      if (!month || !year || parseInt(month) < 1 || parseInt(month) > 12) {
        errors.expiryDate = "Invalid expiry date";
      } else if (
        parseInt(year) < currentYear ||
        (parseInt(year) === currentYear && parseInt(month) < currentMonth)
      ) {
        errors.expiryDate = "Card has expired";
      }
    }

    if (!cvv.trim()) {
      errors.cvv = "CVV is required";
    } else if (cvv.length < 3) {
      errors.cvv = "Invalid CVV";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle save payment method
  const handleSavePaymentMethod = () => {
    if (!validateForm()) {
      return;
    }

    // In a real app, you would call an API to save the payment method

    if (editingPaymentMethod) {
      // Update existing payment method
      const updatedPaymentMethods = paymentMethods.map((method: any) =>
        method.id === (editingPaymentMethod as any).id
          ? {
              ...method,
              cardholderName,
              expiryDate,
              isDefault,
              // In a real app, card number and CVV would be handled on the server
            }
          : isDefault
          ? { ...method, isDefault: false }
          : method
      );

      setPaymentMethods(updatedPaymentMethods as any);
      Alert.alert("Success", "Payment method updated successfully");
    } else {
      // Add new payment method
      const newPaymentMethod = {
        id: Date.now().toString(),
        type: "credit_card",
        cardholderName,
        cardNumber: `•••• •••• •••• ${cardNumber.substr(-4)}`,
        cardBrand: getCardBrand(cardNumber),
        expiryDate,
        isDefault,
      };

      if (isDefault) {
        // Set all other methods to non-default
        const updatedPaymentMethods = paymentMethods.map((method: any) => ({
          ...method,
          isDefault: false,
        }));

        setPaymentMethods([...updatedPaymentMethods, newPaymentMethod]);
      } else {
        setPaymentMethods([...paymentMethods, newPaymentMethod]);
      }

      Alert.alert("Success", "Payment method added successfully");
    }

    setModalVisible(false);
  };

  // Delete payment method
  const handleDeletePaymentMethod = (id: any) => {
    Alert.alert(
      "Delete Payment Method",
      "Are you sure you want to delete this payment method?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // In a real app, you would call an API to delete the payment method
            const updatedPaymentMethods = paymentMethods.filter(
              (method) => method.id !== id
            );
            setPaymentMethods(updatedPaymentMethods);

            Alert.alert("Success", "Payment method deleted successfully");
          },
        },
      ]
    );
  };

  // Set default payment method
  const handleSetDefaultPaymentMethod = (id: any) => {
    // In a real app, you would call an API to update the default payment method
    const updatedPaymentMethods = paymentMethods.map((method) => ({
      ...method,
      isDefault: method.id === id,
    }));

    setPaymentMethods(updatedPaymentMethods);
  };

  // Determine card brand from card number
  const getCardBrand = (number: string) => {
    const firstDigit = number.charAt(0);
    const firstTwoDigits = parseInt(number.substr(0, 2));

    if (firstDigit === "4") {
      return "Visa";
    } else if (firstTwoDigits >= 51 && firstTwoDigits <= 55) {
      return "Mastercard";
    } else if (firstTwoDigits === 34 || firstTwoDigits === 37) {
      return "American Express";
    } else if (firstTwoDigits === 62 || firstTwoDigits === 60) {
      return "Discover";
    }

    return "Credit Card";
  };

  // Get card icon based on brand
  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case "visa":
        return "credit-card";
      case "mastercard":
        return "credit-card";
      case "american express":
        return "credit-card";
      case "discover":
        return "credit-card";
      default:
        return "credit-card";
    }
  };

  // Render payment method item
  const renderPaymentMethodItem = ({ item }: any) => (
    <View
      style={[styles.paymentMethodCard, { backgroundColor: theme.colors.card }]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardBrandContainer}>
          <MaterialCommunityIcons
            name={getCardIcon(item.cardBrand)}
            size={24}
            color={theme.colors.primary}
          />
          <Text style={[styles.cardBrand, { color: theme.colors.text }]}>
            {item.cardBrand}
          </Text>
        </View>

        {item.isDefault && (
          <View
            style={[
              styles.defaultBadge,
              { backgroundColor: theme.colors.primary + "20" },
            ]}
          >
            <Text style={[styles.defaultText, { color: theme.colors.primary }]}>
              Default
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.cardNumber, { color: theme.colors.text }]}>
        {item.cardNumber}
      </Text>

      <View style={styles.cardDetails}>
        <View style={styles.cardholderContainer}>
          <Text style={[styles.cardLabel, { color: theme.colors.darkGray }]}>
            CARDHOLDER NAME
          </Text>
          <Text style={[styles.cardholderName, { color: theme.colors.text }]}>
            {item.cardholderName}
          </Text>
        </View>

        <View style={styles.expiryContainer}>
          <Text style={[styles.cardLabel, { color: theme.colors.darkGray }]}>
            EXPIRES
          </Text>
          <Text style={[styles.expiryDate, { color: theme.colors.text }]}>
            {item.expiryDate}
          </Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.cardAction}
          onPress={() => openPaymentMethodModal(item)}
        >
          <MaterialCommunityIcons
            name="pencil"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={[styles.actionText, { color: theme.colors.primary }]}>
            Edit
          </Text>
        </TouchableOpacity>

        {!item.isDefault && (
          <TouchableOpacity
            style={styles.cardAction}
            onPress={() => handleSetDefaultPaymentMethod(item.id)}
          >
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color={theme.colors.success}
            />
            <Text style={[styles.actionText, { color: theme.colors.success }]}>
              Set as Default
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.cardAction}
          onPress={() => handleDeletePaymentMethod(item.id)}
        >
          <MaterialCommunityIcons
            name="delete"
            size={20}
            color={theme.colors.error}
          />
          <Text style={[styles.actionText, { color: theme.colors.error }]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="credit-card-off"
        size={60}
        color={theme.colors.placeholder}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No Payment Methods
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.darkGray }]}>
        You haven't added any payment methods yet. Add a credit card or other
        payment method to make checkout easy.
      </Text>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => openPaymentMethodModal(null)}
      >
        <MaterialCommunityIcons
          name="plus"
          size={20}
          color={theme.colors.white}
        />
        <Text style={[styles.addButtonText, { color: theme.colors.white }]}>
          Add Payment Method
        </Text>
      </TouchableOpacity>
    </View>
  );

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
          Loading payment methods...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Payment Methods
          </Text>
          <TouchableOpacity
            style={[
              styles.headerButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => openPaymentMethodModal(null)}
          >
            <MaterialCommunityIcons
              name="plus"
              size={20}
              color={theme.colors.white}
            />
          </TouchableOpacity>
        </View>

        {/* Payment Methods List */}
        {paymentMethods.length > 0 ? (
          <FlatList
            data={paymentMethods}
            renderItem={renderPaymentMethodItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          renderEmptyState()
        )}

        {/* Add/Edit Payment Method Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <View
              style={[
                styles.modalContent,
                { backgroundColor: theme.colors.card },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  {editingPaymentMethod
                    ? "Edit Payment Method"
                    : "Add Payment Method"}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={theme.colors.darkGray}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Card Number Input */}
                <View style={styles.formGroup}>
                  <Text
                    style={[styles.formLabel, { color: theme.colors.text }]}
                  >
                    Card Number
                  </Text>
                  <View
                    style={[
                      styles.formInput,
                      (formErrors as any).cardNumber
                        ? { borderColor: theme.colors.error }
                        : { borderColor: theme.colors.border },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="credit-card"
                      size={20}
                      color={theme.colors.darkGray}
                    />
                    <TextInput
                      style={[styles.textInput, { color: theme.colors.text }]}
                      placeholder="1234 5678 9012 3456"
                      placeholderTextColor={theme.colors.placeholder}
                      value={cardNumber}
                      onChangeText={(text) =>
                        setCardNumber(formatCardNumber(text))
                      }
                      keyboardType="numeric"
                      maxLength={19}
                    />
                  </View>
                  {(formErrors as any).cardNumber && (
                    <Text
                      style={[styles.errorText, { color: theme.colors.error }]}
                    >
                      {(formErrors as any).cardNumber}
                    </Text>
                  )}
                </View>

                {/* Cardholder Name Input */}
                <View style={styles.formGroup}>
                  <Text
                    style={[styles.formLabel, { color: theme.colors.text }]}
                  >
                    Cardholder Name
                  </Text>
                  <View
                    style={[
                      styles.formInput,
                      (formErrors as any).cardholderName
                        ? { borderColor: theme.colors.error }
                        : { borderColor: theme.colors.border },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="account"
                      size={20}
                      color={theme.colors.darkGray}
                    />
                    <TextInput
                      style={[styles.textInput, { color: theme.colors.text }]}
                      placeholder="John Doe"
                      placeholderTextColor={theme.colors.placeholder}
                      value={cardholderName}
                      onChangeText={setCardholderName}
                      autoCapitalize="words"
                    />
                  </View>
                  {(formErrors as any).cardholderName && (
                    <Text
                      style={[styles.errorText, { color: theme.colors.error }]}
                    >
                      {(formErrors as any).cardholderName}
                    </Text>
                  )}
                </View>

                {/* Expiry Date and CVV */}
                <View style={styles.formRow}>
                  <View
                    style={[styles.formGroup, { flex: 1, marginRight: 10 }]}
                  >
                    <Text
                      style={[styles.formLabel, { color: theme.colors.text }]}
                    >
                      Expiry Date
                    </Text>
                    <View
                      style={[
                        styles.formInput,
                        (formErrors as any).expiryDate
                          ? { borderColor: theme.colors.error }
                          : { borderColor: theme.colors.border },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="calendar"
                        size={20}
                        color={theme.colors.darkGray}
                      />
                      <TextInput
                        style={[styles.textInput, { color: theme.colors.text }]}
                        placeholder="MM/YY"
                        placeholderTextColor={theme.colors.placeholder}
                        value={expiryDate}
                        onChangeText={(text) =>
                          setExpiryDate(formatExpiryDate(text))
                        }
                        keyboardType="numeric"
                        maxLength={5}
                      />
                    </View>
                    {(formErrors as any).expiryDate && (
                      <Text
                        style={[
                          styles.errorText,
                          { color: theme.colors.error },
                        ]}
                      >
                        {(formErrors as any).expiryDate}
                      </Text>
                    )}
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text
                      style={[styles.formLabel, { color: theme.colors.text }]}
                    >
                      CVV
                    </Text>
                    <View
                      style={[
                        styles.formInput,
                        (formErrors as any).cvv
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
                        style={[styles.textInput, { color: theme.colors.text }]}
                        placeholder="123"
                        placeholderTextColor={theme.colors.placeholder}
                        value={cvv}
                        onChangeText={(text) =>
                          setCvv(text.replace(/[^0-9]/g, ""))
                        }
                        keyboardType="numeric"
                        maxLength={4}
                        secureTextEntry
                      />
                    </View>
                    {(formErrors as any).cvv && (
                      <Text
                        style={[
                          styles.errorText,
                          { color: theme.colors.error },
                        ]}
                      >
                        {(formErrors as any).cvv}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Default Payment Method */}
                <View style={styles.defaultContainer}>
                  <Text
                    style={[styles.defaultLabel, { color: theme.colors.text }]}
                  >
                    Set as default payment method
                  </Text>
                  <Switch
                    value={isDefault}
                    onValueChange={setIsDefault}
                    trackColor={{
                      false: theme.colors.border,
                      true: theme.colors.primary + "50",
                    }}
                    thumbColor={
                      isDefault ? theme.colors.primary : theme.colors.gray
                    }
                  />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={handleSavePaymentMethod}
                >
                  <Text
                    style={[
                      styles.saveButtonText,
                      { color: theme.colors.white },
                    ]}
                  >
                    {editingPaymentMethod
                      ? "Update Payment Method"
                      : "Save Payment Method"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Error message if any */}
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
            <Text
              style={[styles.errorMessageText, { color: theme.colors.error }]}
            >
              {error}
            </Text>
            <TouchableOpacity
              style={[
                styles.retryButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={fetchPaymentMethods}
            >
              <Text
                style={[styles.retryButtonText, { color: theme.colors.white }]}
              >
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Add payment method button (fixed at bottom) */}
        {paymentMethods.length > 0 && (
          <TouchableOpacity
            style={[
              styles.floatingButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => openPaymentMethodModal(null)}
          >
            <MaterialCommunityIcons
              name="plus"
              size={24}
              color={theme.colors.white}
            />
          </TouchableOpacity>
        )}
      </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Space for floating button
  },
  paymentMethodCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardBrandContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardBrand: {
    fontWeight: "500",
    fontSize: 16,
    marginLeft: 8,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: "500",
  },
  cardNumber: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    letterSpacing: 1,
  },
  cardDetails: {
    flexDirection: "row",
    marginBottom: 16,
  },
  cardholderContainer: {
    flex: 3,
    marginRight: 16,
  },
  expiryContainer: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 10,
    marginBottom: 4,
  },
  cardholderName: {
    fontSize: 14,
  },
  expiryDate: {
    fontSize: 14,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
  },
  cardAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  floatingButton: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
  },
  modalContent: {
    margin: 20,
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 6,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  formInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
  },
  textInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  defaultContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 16,
  },
  defaultLabel: {
    fontSize: 14,
    fontWeight: "500",
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
  errorContainer: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  errorMessageText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  retryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default PaymentMethodsScreen;
