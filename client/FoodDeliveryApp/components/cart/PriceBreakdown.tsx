import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

const PriceBreakdown = ({
  subtotal,
  deliveryFee,
  serviceCharge,
  discount,
  total,
}: any) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { borderColor: theme.colors.border }]}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.colors.darkGray }]}>
          Subtotal
        </Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>
          ${subtotal.toFixed(2)}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.colors.darkGray }]}>
          Delivery Fee
        </Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>
          ${deliveryFee.toFixed(2)}
        </Text>
      </View>

      {serviceCharge > 0 && (
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.colors.darkGray }]}>
            Service Charge
          </Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>
            ${serviceCharge.toFixed(2)}
          </Text>
        </View>
      )}

      {discount > 0 && (
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.colors.darkGray }]}>
            Discount
          </Text>
          <Text style={[styles.value, { color: theme.colors.primary }]}>
            -${discount.toFixed(2)}
          </Text>
        </View>
      )}

      <View
        style={[styles.divider, { backgroundColor: theme.colors.border }]}
      />

      <View style={styles.row}>
        <Text style={[styles.totalLabel, { color: theme.colors.text }]}>
          Total
        </Text>
        <Text style={[styles.totalValue, { color: theme.colors.text }]}>
          ${total.toFixed(2)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default PriceBreakdown;
