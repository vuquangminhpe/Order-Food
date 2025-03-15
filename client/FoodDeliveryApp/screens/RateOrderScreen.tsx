import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../contexts/ThemeContext";
import { orderService } from "../api/orderService";

const StarRating = ({
  rating,
  setRating,
  size = 30,
  disabled = false,
}: any) => {
  const { theme } = useTheme();

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => !disabled && setRating(i)}
          disabled={disabled}
          style={{ padding: 5 }}
        >
          <Icon
            name={i <= rating ? "star" : "star-outline"}
            size={size}
            color={
              i <= rating ? theme.colors.warning : theme.colors.placeholder
            }
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  return <View style={styles.starsContainer}>{renderStars()}</View>;
};

const RateOrderScreen = ({ route, navigation }: any) => {
  const { orderId } = route.params;
  const { theme } = useTheme();

  // State
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rating state
  const [overallRating, setOverallRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [review, setReview] = useState("");

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const orderData = await orderService.getOrderById(orderId);
        setOrder(orderData);

        // If order already has a rating, initialize with existing values
        if (orderData.rating) {
          setOverallRating(orderData.rating.overall || 0);
          setFoodRating(orderData.rating.food || 0);
          setDeliveryRating(orderData.rating.delivery || 0);
          setReview(orderData.rating.review || "");
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError("Failed to load order details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  // Submit rating
  const handleSubmitRating = async () => {
    // Validate ratings
    if (overallRating === 0) {
      Alert.alert("Error", "Please provide an overall rating");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await orderService.rateOrder(
        orderId,
        overallRating,
        review,
        foodRating,
        deliveryRating
      );

      Alert.alert(
        "Thank You!",
        "Your rating has been submitted successfully.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      console.error("Error submitting rating:", err);
      setError("Failed to submit rating. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
          Loading order details...
        </Text>
      </View>
    );
  }

  // Check if order can be rated
  const canRateOrder = () => {
    if (!order) return false;

    // If order has already been rated and we're not updating
    if (order.rating && !route.params?.update) {
      return false;
    }

    return true;
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          style={[
            styles.container,
            { backgroundColor: theme.colors.background },
          ]}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Order Info */}
          <View
            style={[
              styles.orderInfoCard,
              { backgroundColor: theme.colors.card },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Order #{order?.orderNumber}
            </Text>

            <View style={styles.orderInfoRow}>
              <Icon name="store" size={16} color={theme.colors.darkGray} />
              <Text
                style={[styles.orderInfoText, { color: theme.colors.text }]}
              >
                {order?.restaurant?.name || "Restaurant"}
              </Text>
            </View>

            <View style={styles.orderInfoRow}>
              <Icon name="calendar" size={16} color={theme.colors.darkGray} />
              <Text
                style={[styles.orderInfoText, { color: theme.colors.text }]}
              >
                Delivered on{" "}
                {new Date(
                  order?.delivered_at || order?.updated_at
                ).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.orderInfoRow}>
              <Icon name="food" size={16} color={theme.colors.darkGray} />
              <Text
                style={[styles.orderInfoText, { color: theme.colors.text }]}
                numberOfLines={2}
              >
                {order?.items
                  ?.map((item: any) => `${item.quantity}x ${item.name}`)
                  .join(", ")}
              </Text>
            </View>
          </View>

          {/* Rating Section */}
          {canRateOrder() ? (
            <>
              <View style={styles.ratingSection}>
                <Text
                  style={[styles.ratingTitle, { color: theme.colors.text }]}
                >
                  How was your overall experience?
                </Text>
                <StarRating
                  rating={overallRating}
                  setRating={setOverallRating}
                  size={40}
                />

                <Text
                  style={[styles.ratingSubtitle, { color: theme.colors.text }]}
                >
                  Food Quality
                </Text>
                <StarRating rating={foodRating} setRating={setFoodRating} />

                <Text
                  style={[styles.ratingSubtitle, { color: theme.colors.text }]}
                >
                  Delivery Service
                </Text>
                <StarRating
                  rating={deliveryRating}
                  setRating={setDeliveryRating}
                />
              </View>

              <View style={styles.reviewSection}>
                <Text
                  style={[styles.reviewTitle, { color: theme.colors.text }]}
                >
                  Share your feedback (optional)
                </Text>
                <TextInput
                  style={[
                    styles.reviewInput,
                    {
                      backgroundColor: theme.colors.gray,
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  placeholder="Tell us about your experience..."
                  placeholderTextColor={theme.colors.placeholder}
                  value={review}
                  onChangeText={setReview}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: theme.colors.primary },
                  (!overallRating || submitting) && { opacity: 0.6 },
                ]}
                onPress={handleSubmitRating}
                disabled={!overallRating || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={theme.colors.white} size="small" />
                ) : (
                  <Text
                    style={[
                      styles.submitButtonText,
                      { color: theme.colors.white },
                    ]}
                  >
                    Submit Rating
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.alreadyRatedContainer}>
              <Icon
                name="check-circle"
                size={60}
                color={theme.colors.success}
              />
              <Text
                style={[styles.alreadyRatedTitle, { color: theme.colors.text }]}
              >
                You've already rated this order
              </Text>
              <Text
                style={[
                  styles.alreadyRatedSubtitle,
                  { color: theme.colors.darkGray },
                ]}
              >
                Thank you for your feedback!
              </Text>

              <View style={styles.existingRatingContainer}>
                <Text
                  style={[
                    styles.existingRatingLabel,
                    { color: theme.colors.text },
                  ]}
                >
                  Your Rating:
                </Text>
                <StarRating
                  rating={order?.rating?.overall || 0}
                  setRating={() => {}}
                  disabled={true}
                />

                {order?.rating?.review && (
                  <View
                    style={[
                      styles.existingReview,
                      { backgroundColor: theme.colors.gray },
                    ]}
                  >
                    <Text
                      style={[
                        styles.existingReviewText,
                        { color: theme.colors.text },
                      ]}
                    >
                      "{order.rating.review}"
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.backButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => navigation.goBack()}
              >
                <Text
                  style={[styles.backButtonText, { color: theme.colors.white }]}
                >
                  Back to Order Details
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Error message if any */}
          {error && (
            <View
              style={[
                styles.errorContainer,
                { backgroundColor: "rgba(255, 0, 0, 0.1)" },
              ]}
            >
              <Icon name="alert-circle" size={20} color={theme.colors.error} />
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {error}
              </Text>
            </View>
          )}
        </ScrollView>
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
  contentContainer: {
    padding: 16,
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
  orderInfoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  orderInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  orderInfoText: {
    fontSize: 14,
    marginLeft: 8,
  },
  ratingSection: {
    marginBottom: 24,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  ratingSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    textAlign: "center",
  },
  reviewSection: {
    marginBottom: 24,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    height: 120,
    fontSize: 14,
  },
  submitButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  alreadyRatedContainer: {
    alignItems: "center",
    padding: 20,
  },
  alreadyRatedTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  alreadyRatedSubtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  existingRatingContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 24,
  },
  existingRatingLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  existingReview: {
    width: "100%",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  existingReviewText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
});

export default RateOrderScreen;
