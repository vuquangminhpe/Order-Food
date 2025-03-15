import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../contexts/ThemeContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.8;

const PromotionCard = ({
  title,
  description,
  image,
  code,
  onPress,
  expiryDate,
}: any) => {
  const { theme } = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress({ title, description, image, code, expiryDate });
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <ImageBackground
        source={{ uri: image }}
        style={styles.imageBackground}
        imageStyle={styles.image}
      >
        <View
          style={[styles.overlay, { backgroundColor: "rgba(0, 0, 0, 0.4)" }]}
        >
          <View style={styles.contentContainer}>
            <Text style={[styles.title, { color: theme.colors.white }]}>
              {title}
            </Text>

            <Text
              style={[styles.description, { color: theme.colors.white }]}
              numberOfLines={2}
            >
              {description}
            </Text>

            {expiryDate && (
              <Text style={[styles.expiryDate, { color: theme.colors.white }]}>
                Expires: {expiryDate}
              </Text>
            )}
          </View>

          {code && (
            <View
              style={[
                styles.codeContainer,
                { backgroundColor: theme.colors.white },
              ]}
            >
              <Text
                style={[styles.codeLabel, { color: theme.colors.darkGray }]}
              >
                Use code:
              </Text>
              <Text style={[styles.code, { color: theme.colors.primary }]}>
                {code}
              </Text>
              <Icon
                name="content-copy"
                size={16}
                color={theme.colors.darkGray}
              />
            </View>
          )}
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imageBackground: {
    width: "100%",
    height: "100%",
  },
  image: {
    borderRadius: 12,
  },
  overlay: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
    borderRadius: 12,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  expiryDate: {
    fontSize: 12,
    opacity: 0.8,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  codeLabel: {
    fontSize: 12,
    marginRight: 6,
  },
  code: {
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 8,
    flex: 1,
  },
});

export default PromotionCard;
