import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  Share,
  FlatList,
  SectionList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { restaurantService } from "../api/restaurantService";
import { menuService } from "../api/menuService";
import MenuItem from "../components/restaurant/MenuItem";
import RatingStars from "../components/general/RatingStars";
import MenuCategoryTab from "../components/restaurant/MenuCategoryTab";
import ReviewItem from "../components/restaurant/ReviewItem";
import RightDrawer from "../components/restaurant/RightDrawer";

const { width, height } = Dimensions.get("window");
const HEADER_MAX_HEIGHT = 220;
const HEADER_MIN_HEIGHT = Platform.OS === "ios" ? 90 : 70;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const RestaurantScreen = ({ route, navigation }: any) => {
  const { id: restaurantId } = route.params;
  const { theme } = useTheme();
  const { user } = useAuth();
  const { cart, addItem } = useCart();
  const insets = useSafeAreaInsets();

  // Refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const cartDrawerRef = useRef<{
    close(): unknown;
    open: () => void;
  } | null>(null);

  // State
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(true);
  const [ratingsLoading, setRatingsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Derived values from animations
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 0.5, 1],
    extrapolate: "clamp",
  });

  // Fetch restaurant data
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setLoading(true);
        setError(null);

        const restaurantData = await restaurantService.getRestaurantById(
          restaurantId
        );
        setRestaurant(restaurantData);

        // Check if restaurant is in favorites (mock implementation)
        setIsFavorite(Math.random() > 0.5); // Random for demo purposes
      } catch (err) {
        console.error("Error fetching restaurant:", err);
        setError("Failed to load restaurant details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [restaurantId]);

  // Fetch menu data
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setMenuLoading(true);

        const menuData = await menuService.getRestaurantMenu(restaurantId);
        setMenu(menuData);

        // Set first category as active if menu has categories
        if (menuData && menuData.length > 0) {
          setActiveTab(0);
        }
      } catch (err) {
        console.error("Error fetching menu:", err);
        setError("Failed to load menu. Please try again.");
      } finally {
        setMenuLoading(false);
      }
    };

    fetchMenuData();
  }, [restaurantId]);

  // Fetch ratings
  useEffect(() => {
    const fetchRatings = async () => {
      try {
        setRatingsLoading(true);

        const ratingsData = await restaurantService.getRestaurantRatings(
          restaurantId
        );
        setRatings(ratingsData.ratings);
      } catch (err) {
        console.error("Error fetching ratings:", err);
        // Not setting error here since this is not critical
      } finally {
        setRatingsLoading(false);
      }
    };

    fetchRatings();
  }, [restaurantId]);

  // Handle scroll to category
  const scrollToCategory = (index: number) => {
    setActiveTab(index);

    if (scrollViewRef.current) {
      // Find Y position of the category
      let yOffset = 0;
      for (let i = 0; i < index; i++) {
        const previousCategory = menu[i] as any;
        yOffset += 48; // Category header height
        yOffset += previousCategory.items.length * 100; // Approximate height of items
      }

      // Add header height and some padding
      yOffset += HEADER_MIN_HEIGHT + 100;

      // Scroll to position
      scrollViewRef.current.scrollTo({ y: yOffset, animated: true });
    }
  };

  // Add item to cart
  const handleAddItem = (item: {
    _id: any;
    name: any;
    discountedPrice: any;
    price: any;
  }) => {
    // Format item for cart
    const cartItem = {
      menuItemId: item._id,
      name: item.name,
      price: item.discountedPrice || item.price,
      quantity: 1,
      options: [],
      totalPrice: item.discountedPrice || item.price,
    };

    // Check if trying to add from a different restaurant
    if (cart.restaurantId && cart.restaurantId !== restaurantId) {
      // Show cart drawer with warning
      if (cartDrawerRef.current) {
        cartDrawerRef.current.open();
      }
      return;
    }

    // Otherwise add normally
    const success = addItem(restaurantId, (restaurant as any).name, cartItem);

    if (success) {
      // Show success message or animation
    }
  };

  // Open menu item detail
  const handleMenuItemPress = (item: { _id: any; name: any }) => {
    navigation.navigate("MenuItem", {
      id: item._id,
      name: item.name,
      restaurantId: restaurantId,
      restaurantName: (restaurant as any).name,
    });
  };

  // Toggle favorite
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // In a real app, you would call an API to save/remove from favorites
  };

  // Share restaurant
  const shareRestaurant = async () => {
    try {
      await Share.share({
        message: `Check out ${(restaurant as any).name} on Food Delivery App!`,
        // In a real app, include a deep link URL
      });
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  // Render restaurant info
  const renderRestaurantInfo = () => (
    <View style={styles.infoContainer}>
      <View style={styles.infoRow}>
        <View style={styles.infoLeft}>
          <Text style={[styles.restaurantName, { color: theme.colors.text }]}>
            {(restaurant as any).name}
          </Text>

          <View style={styles.categoryRow}>
            {(restaurant as any).categories?.map(
              (
                category:
                  | string
                  | number
                  | boolean
                  | React.ReactElement<
                      any,
                      string | React.JSXElementConstructor<any>
                    >
                  | Iterable<React.ReactNode>
                  | React.ReactPortal
                  | null
                  | undefined,
                index: React.Key | null | undefined
              ) => (
                <View
                  key={index}
                  style={[
                    styles.categoryTag,
                    { backgroundColor: theme.colors.gray },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      { color: theme.colors.darkGray },
                    ]}
                  >
                    {category}
                  </Text>
                </View>
              )
            )}
          </View>

          <View style={styles.ratingsRow}>
            <RatingStars rating={(restaurant as any).rating || 0} size={16} />
            <Text style={[styles.ratingText, { color: theme.colors.text }]}>
              {(restaurant as any).rating?.toFixed(1) || "0.0"}
              <Text style={{ color: theme.colors.darkGray }}>
                ({(restaurant as any).totalRatings || 0} ratings)
              </Text>
            </Text>
          </View>
        </View>

        <View style={styles.infoRight}>
          <TouchableOpacity
            style={[styles.infoButton, { backgroundColor: theme.colors.gray }]}
            onPress={toggleFavorite}
          >
            <Icon
              name={isFavorite ? "heart" : "heart-outline"}
              size={20}
              color={isFavorite ? theme.colors.primary : theme.colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.infoButton, { backgroundColor: theme.colors.gray }]}
            onPress={shareRestaurant}
          >
            <Icon name="share-variant" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Icon name="clock-outline" size={16} color={theme.colors.darkGray} />
          <Text style={[styles.detailText, { color: theme.colors.text }]}>
            {restaurantIsOpen() ? "Open Now" : "Closed"}
            <Text style={{ color: theme.colors.darkGray }}>
              {" "}
              ⋅ Closes at 10PM
            </Text>
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Icon
            name="map-marker-outline"
            size={16}
            color={theme.colors.darkGray}
          />
          <Text
            style={[styles.detailText, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {(restaurant as any).address}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Icon name="cash" size={16} color={theme.colors.darkGray} />
          <Text style={[styles.detailText, { color: theme.colors.text }]}>
            ${(restaurant as any).minOrderAmount || 0} minimum
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Icon name="bike" size={16} color={theme.colors.darkGray} />
          <Text style={[styles.detailText, { color: theme.colors.text }]}>
            ${(restaurant as any).deliveryFee || 0} delivery
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Icon name="clock-fast" size={16} color={theme.colors.darkGray} />
          <Text style={[styles.detailText, { color: theme.colors.text }]}>
            {(restaurant as any).estimatedDeliveryTime || 30}-
            {((restaurant as any).estimatedDeliveryTime || 30) + 10} min
          </Text>
        </View>
      </View>
    </View>
  );

  // Check if restaurant is open (simple mock)
  const restaurantIsOpen = () => {
    // For demo purposes - in reality would check openingHours against current time
    return true;
  };

  // Render menu categories tabs
  const renderCategoryTabs = () => (
    <View style={styles.tabsContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScrollContent}
      >
        {menu.map((category: any, index) => (
          <MenuCategoryTab
            key={index}
            title={category.category.name}
            isActive={activeTab === index}
            onPress={() => scrollToCategory(index)}
          />
        ))}
      </ScrollView>
    </View>
  );

  // Render menu sections
  const renderMenuSections = () => (
    <View style={styles.menuContainer}>
      {menuLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading menu...
          </Text>
        </View>
      ) : (
        menu.map((category: any, categoryIndex) => (
          <View key={categoryIndex} style={styles.menuSection}>
            <Text
              style={[styles.menuSectionTitle, { color: theme.colors.text }]}
            >
              {(category as any).category.name}
            </Text>

            {category.items.map((item: any, itemIndex: any) => (
              <MenuItem
                key={itemIndex}
                item={item}
                onPress={() => handleMenuItemPress(item)}
                onAddToCart={() => handleAddItem(item)}
              />
            ))}
          </View>
        ))
      )}
    </View>
  );

  // Render ratings & reviews
  const renderRatings = () => (
    <View style={styles.ratingsContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Ratings & Reviews
      </Text>

      {ratingsLoading ? (
        <ActivityIndicator
          size="small"
          color={theme.colors.primary}
          style={styles.ratingsLoading}
        />
      ) : ratings.length > 0 ? (
        <>
          <View style={styles.ratingsSummary}>
            <View style={styles.ratingsBig}>
              <Text
                style={[styles.ratingsBigText, { color: theme.colors.text }]}
              >
                {(restaurant as any).rating?.toFixed(1) || "0.0"}
              </Text>
              <RatingStars rating={(restaurant as any).rating || 0} size={20} />
              <Text
                style={[
                  styles.ratingsBigCount,
                  { color: theme.colors.darkGray },
                ]}
              >
                {(restaurant as any).totalRatings || 0} ratings
              </Text>
            </View>

            <View style={styles.ratingsBreakdown}>
              {/* Rating breakdown would go here in a real app */}
              <Text style={{ color: theme.colors.darkGray }}>
                Food: 4.5 ⋅ Delivery: 4.2
              </Text>
            </View>
          </View>

          {ratings.slice(0, 3).map((rating, index) => (
            <ReviewItem key={index} review={rating} />
          ))}

          {ratings.length > 3 && (
            <TouchableOpacity style={styles.seeAllButton}>
              <Text
                style={[styles.seeAllText, { color: theme.colors.primary }]}
              >
                See all {ratings.length} reviews
              </Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <Text style={[styles.noRatingsText, { color: theme.colors.darkGray }]}>
          No ratings yet. Be the first to rate!
        </Text>
      )}
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
          Loading restaurant details...
        </Text>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Icon name="alert-circle" size={60} color={theme.colors.error} />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[
            styles.retryButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.retryButtonText, { color: theme.colors.white }]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Animated Header */}
      <Animated.View
        style={[
          styles.header,
          {
            height: headerHeight,
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <Animated.Image
          source={{ uri: (restaurant as any).coverImage }}
          style={[
            styles.headerImage,
            {
              opacity: headerOpacity,
            },
          ]}
        />

        <LinearGradient
          colors={["rgba(0,0,0,0.6)", "transparent"]}
          style={styles.headerGradient}
        />

        <Animated.Text
          style={[
            styles.headerTitle,
            {
              opacity: titleOpacity,
              color: theme.colors.text,
              paddingTop: insets.top,
            },
          ]}
          numberOfLines={1}
        >
          {(restaurant as any).name}
        </Animated.Text>
      </Animated.View>

      {/* Back Button */}
      <TouchableOpacity
        style={[
          styles.backButton,
          {
            backgroundColor: theme.colors.background,
            top: insets.top + 10,
          },
        ]}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-left" size={24} color={theme.colors.text} />
      </TouchableOpacity>

      {/* Main Scroll View */}
      <Animated.ScrollView
        ref={scrollViewRef}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: HEADER_MAX_HEIGHT + 10 },
        ]}
      >
        {/* Restaurant Info */}
        {renderRestaurantInfo()}

        {/* Menu Categories Tabs */}
        {renderCategoryTabs()}

        {/* Menu Sections */}
        {renderMenuSections()}

        {/* Ratings & Reviews */}
        {renderRatings()}

        {/* Bottom padding */}
        <View style={{ height: 80 }} />
      </Animated.ScrollView>

      {/* Cart Drawer Reference */}
      <RightDrawer
        ref={cartDrawerRef}
        title="Your Cart"
        content={
          <View style={styles.cartDrawerContent}>
            <Icon name="cart-alert" size={50} color={theme.colors.primary} />
            <Text
              style={[styles.cartDrawerTitle, { color: theme.colors.text }]}
            >
              Replace cart?
            </Text>
            <Text
              style={[
                styles.cartDrawerDescription,
                { color: theme.colors.darkGray },
              ]}
            >
              Your cart contains items from another (restaurant as any). Do you
              want to replace your current cart with items from this restaurant?
            </Text>
            <TouchableOpacity
              style={[
                styles.cartDrawerButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => {
                // Clear cart and add the new item
                if (cartDrawerRef.current) {
                  cartDrawerRef.current.close();
                }
              }}
            >
              <Text
                style={[
                  styles.cartDrawerButtonText,
                  { color: theme.colors.white },
                ]}
              >
                Replace Cart
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cartDrawerSecondaryButton]}
              onPress={() => {
                if (cartDrawerRef.current) {
                  cartDrawerRef.current.close();
                }
              }}
            >
              <Text
                style={[
                  styles.cartDrawerSecondaryButtonText,
                  { color: theme.colors.text },
                ]}
              >
                Keep Current Cart
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
    zIndex: 10,
  },
  headerImage: {
    width: "100%",
    height: HEADER_MAX_HEIGHT,
    resizeMode: "cover",
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  headerTitle: {
    position: "absolute",
    bottom: 8,
    left: 58,
    right: 16,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "left",
  },
  backButton: {
    position: "absolute",
    top: 10,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  infoContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoLeft: {
    flex: 1,
  },
  infoRight: {
    flexDirection: "row",
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
  },
  ratingsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  detailsRow: {
    marginTop: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    marginLeft: 8,
  },
  tabsContainer: {
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
  },
  menuContainer: {
    padding: 16,
  },
  menuSection: {
    marginBottom: 24,
  },
  menuSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  ratingsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  ratingsLoading: {
    marginTop: 20,
    marginBottom: 20,
  },
  ratingsSummary: {
    flexDirection: "row",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  ratingsBig: {
    alignItems: "center",
    paddingRight: 20,
    marginRight: 20,
    borderRightWidth: 1,
    borderRightColor: "rgba(0,0,0,0.05)",
  },
  ratingsBigText: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 4,
  },
  ratingsBigCount: {
    fontSize: 12,
    marginTop: 4,
  },
  ratingsBreakdown: {
    flex: 1,
    justifyContent: "center",
  },
  noRatingsText: {
    fontSize: 14,
    textAlign: "center",
    padding: 20,
  },
  seeAllButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  cartDrawerContent: {
    padding: 20,
    alignItems: "center",
  },
  cartDrawerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  cartDrawerDescription: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  cartDrawerButton: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 12,
  },
  cartDrawerButtonText: {
    fontWeight: "500",
    fontSize: 16,
  },
  cartDrawerSecondaryButton: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
  },
  cartDrawerSecondaryButtonText: {
    fontWeight: "500",
    fontSize: 16,
  },
});

export default RestaurantScreen;
