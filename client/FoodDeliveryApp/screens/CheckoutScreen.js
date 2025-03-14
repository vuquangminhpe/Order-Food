import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../contexts/ThemeContext";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "../contexts/LocationContext";
import { orderService, PaymentMethod } from "../api/orderService";
import { paymentService } from "../api/paymentService";
import PriceBreakdown from "../components/cart/PriceBreakdown";
import AddressCard from "../components/user/AddressCard";
import PaymentMethodCard from "../components/payment/PaymentMethodCard";

const CheckoutScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const { selectedAddress } = useLocation();

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(
    PaymentMethod.CashOnDelivery
  );
  const [notes, setNotes] = useState("");
  const [scheduledTime, setScheduledTime] = useState(null); // For future scheduled delivery

  // Check if checkout is possible
  useEffect(() => {
    if (!selectedAddress) {
      setError("Please select a delivery address to continue.");
    } else {
      setError(null);
    }
  }, [selectedAddress]);

  // Handle payment method change
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  // Handle address selection
  const handleAddressSelect = () => {
    navigation.navigate("AddressList", { selectMode: true });
  };

  // Handle adding a new address
  const handleAddAddress = () => {
    navigation.navigate("AddAddress");
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setError("Please select a delivery address to continue.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Format order data
      const orderData = {
        restaurantId: cart.restaurantId,
        items: cart.items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          options: item.options,
        })),
        deliveryAddress: {
          address: selectedAddress.address,
          lat: selectedAddress.lat,
          lng: selectedAddress.lng,
        },
        paymentMethod,
        notes,
        scheduledFor: scheduledTime,
      };

      // Create order
      const orderResult = await orderService.createOrder(orderData);

      // If payment method is cash on delivery, navigate to order confirmation
      if (paymentMethod === PaymentMethod.CashOnDelivery) {
        // Clear cart after successful order
        clearCart();

        // Navigate to order confirmation
        navigation.replace("OrderConfirmation", {
          orderId: orderResult.order_id,
          total: orderResult.total,
        });
      }
      // If payment method is online payment, navigate to payment page
      else if (paymentMethod === PaymentMethod.VNPay) {
        // Generate payment URL
        const paymentResult = await paymentService.createPaymentUrl({
          orderId: orderResult.order_id,
          amount: orderResult.total,
          orderInfo: `Payment for order ${orderResult.order_id}`,
        });

        // Clear cart after successful order
        clearCart();

        // Navigate to payment result (in a real app, would use WebView for payment)
        navigation.replace("PaymentResult", {
          orderId: orderResult.order_id,
          paymentUrl: paymentResult.paymentUrl,
        });
      }
    } catch (err) {
      console.error("Error placing order:", err);
      setError("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Check if order can be placed
  const canPlaceOrder = () => {
    return !loading && selectedAddress && cart.items.length > 0;
  };

  // Display delivery address
  const renderDeliveryAddress = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Delivery Address
        </Text>
        <TouchableOpacity onPress={handleAddAddress}>
          <Text style={[styles.actionText, { color: theme.colors.primary }]}>
            Add New
          </Text>
        </TouchableOpacity>
      </View>

      {selectedAddress ? (
        <TouchableOpacity onPress={handleAddressSelect}>
          <AddressCard
            address={selectedAddress}
            selected
            showEditButton={false}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.addAddressButton,
            { borderColor: theme.colors.primary, borderStyle: "dashed" },
          ]}
          onPress={handleAddressSelect}
        >
          <Icon name="plus" size={24} color={theme.colors.primary} />
          <Text
            style={[styles.addAddressText, { color: theme.colors.primary }]}
          >
            Select Delivery Address
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Display payment methods
  const renderPaymentMethods = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Payment Method
        </Text>
      </View>

      <View style={styles.paymentMethodsContainer}>
        <PaymentMethodCard
          title="Cash on Delivery"
          subtitle="Pay when your order arrives"
          icon="cash"
          selected={paymentMethod === PaymentMethod.CashOnDelivery}
          onPress={() =>
            handlePaymentMethodChange(PaymentMethod.CashOnDelivery)
          }
        />

        <PaymentMethodCard
          title="Online Payment"
          subtitle="Pay now with VNPay"
          icon="credit-card"
          selected={paymentMethod === PaymentMethod.VNPay}
          onPress={() => handlePaymentMethodChange(PaymentMethod.VNPay)}
        />
      </View>
    </View>
  );

  // Display order summary
  const renderOrderSummary = () => (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Order Summary
      </Text>

      <View style={styles.orderItems}>
        {cart.items.map((item, index) => (
          <View key={index} style={styles.orderItemRow}>
            <View style={styles.orderItemInfo}>
              <Text
                style={[
                  styles.orderItemQuantity,
                  { color: theme.colors.primary },
                ]}
              >
                {item.quantity}x
              </Text>
              <Text
                style={[styles.orderItemName, { color: theme.colors.text }]}
              >
                {item.name}
              </Text>
            </View>
            <Text style={[styles.orderItemPrice, { color: theme.colors.text }]}>
              ${item.totalPrice.toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <PriceBreakdown
        subtotal={cart.subtotal}
        deliveryFee={cart.deliveryFee}
        serviceCharge={cart.serviceCharge}
        discount={cart.discount}
        total={cart.total}
      />
    </View>
  );

  // Additional notes section
  const renderNotesSection = () => (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Additional Notes
      </Text>

      <TextInput
        style={[
          styles.notesInput,
          {
            backgroundColor: theme.colors.gray,
            color: theme.colors.text,
            borderColor: theme.colors.border,
          },
        ]}
        placeholder="Add notes for your order (optional)"
        placeholderTextColor={theme.colors.placeholder}
        value={notes}
        onChangeText={setNotes}
        multiline
        textAlignVertical="top"
      />
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View
          style={[
            styles.container,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Delivery Address Section */}
            {renderDeliveryAddress()}

            {/* Payment Methods Section */}
            {renderPaymentMethods()}

            {/* Order Summary Section */}
            {renderOrderSummary()}

            {/* Additional Notes Section */}
            {renderNotesSection()}

            {/* Error message if any */}
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

            {/* Bottom space for the order button */}
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Place Order Button */}
          <View
            style={[
              styles.orderButtonContainer,
              {
                backgroundColor: theme.colors.background,
                borderTopColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.totalContainer}>
              <Text
                style={[styles.totalLabel, { color: theme.colors.darkGray }]}
              >
                Total
              </Text>
              <Text style={[styles.totalAmount, { color: theme.colors.text }]}>
                ${cart.total.toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.placeOrderButton,
                {
                  backgroundColor: canPlaceOrder()
                    ? theme.colors.primary
                    : theme.colors.gray,
                },
              ]}
              onPress={handlePlaceOrder}
              disabled={!canPlaceOrder() || loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} size="small" />
              ) : (
                <Text
                  style={[
                    styles.placeOrderText,
                    {
                      color: canPlaceOrder()
                        ? theme.colors.white
                        : theme.colors.darkGray,
                    },
                  ]}
                >
                  Place Order
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  sectionContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  addAddressButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: "dashed",
  },
  addAddressText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  paymentMethodsContainer: {
    marginBottom: 8,
  },
  orderItems: {
    marginBottom: 16,
  },
  orderItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderItemInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  orderItemQuantity: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 8,
  },
  orderItemName: {
    fontSize: 14,
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: "500",
  },
  notesInput: {
    height: 100,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    fontSize: 14,
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
  },
  orderButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  totalContainer: {
    marginRight: 16,
  },
  totalLabel: {
    fontSize: 12,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  placeOrderButton: {
    flex: 1,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CheckoutScreen;
