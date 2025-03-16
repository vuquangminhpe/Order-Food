import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import RatingStars from "../general/RatingStars";

const DeliveryPersonInfo = ({ deliveryPerson, onCall }: any) => {
  const { theme } = useTheme();

  // Default avatar if none provided
  const avatarSource = deliveryPerson.avatar
    ? { uri: deliveryPerson.avatar }
    : require("../../assets/images/default-avatar.png");

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Delivery Person
      </Text>

      <View style={styles.contentContainer}>
        {/* Delivery Person Details */}
        <View style={styles.detailsContainer}>
          <Image source={avatarSource} style={styles.avatar} />

          <View style={styles.infoContainer}>
            <Text style={[styles.name, { color: theme.colors.text }]}>
              {deliveryPerson.name || "Delivery Person"}
            </Text>

            {deliveryPerson.rating && (
              <View style={styles.ratingContainer}>
                <RatingStars rating={deliveryPerson.rating} size={12} />
                <Text
                  style={[styles.ratingText, { color: theme.colors.darkGray }]}
                >
                  {deliveryPerson.rating.toFixed(1)}
                </Text>
              </View>
            )}

            {deliveryPerson.totalDeliveries && (
              <Text
                style={[
                  styles.deliveriesText,
                  { color: theme.colors.darkGray },
                ]}
              >
                {deliveryPerson.totalDeliveries} deliveries
              </Text>
            )}
          </View>
        </View>

        {/* Call Button */}
        <TouchableOpacity
          style={[styles.callButton, { backgroundColor: theme.colors.primary }]}
          onPress={onCall}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="phone"
            size={20}
            color={theme.colors.white}
          />
        </TouchableOpacity>
      </View>

      {/* Contact Message */}
      <View
        style={[
          styles.contactContainer,
          { backgroundColor: theme.colors.highlight },
        ]}
      >
        <MaterialCommunityIcons
          name="information-outline"
          size={16}
          color={theme.colors.primary}
        />
        <Text style={[styles.contactText, { color: theme.colors.text }]}>
          Contact the delivery person if there are any issues with your order
        </Text>
      </View>

      {/* Delivery Status */}
      {deliveryPerson.status && (
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: theme.colors.success },
            ]}
          />
          <Text style={[styles.statusText, { color: theme.colors.text }]}>
            {deliveryPerson.status === "en_route"
              ? "En route to your location"
              : deliveryPerson.status === "picking_up"
              ? "Picking up your order"
              : "Delivery in progress"}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
  },
  contentContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  detailsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  infoContainer: {
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
  },
  deliveriesText: {
    fontSize: 12,
  },
  callButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  contactContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  contactText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
  },
});

export default DeliveryPersonInfo;
