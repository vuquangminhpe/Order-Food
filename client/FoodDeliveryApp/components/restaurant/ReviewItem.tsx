import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.8;

const PromotionCard = ({
  title,
  description,
  image,
  code,
  onPress,
  onCopy,
}: any) => {
  const { theme } = useTheme();

  const handleCopyCode = () => {
    if (onCopy) {
      onCopy(code);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          ...theme.shadow.md,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />

      <View style={styles.contentContainer}>
        <Text
          style={[styles.title, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {title}
        </Text>

        <Text
          style={[styles.description, { color: theme.colors.darkGray }]}
          numberOfLines={2}
        >
          {description}
        </Text>

        {code && (
          <View
            style={[
              styles.codeContainer,
              { backgroundColor: theme.colors.gray },
            ]}
          >
            <Text style={[styles.code, { color: theme.colors.text }]}>
              {code}
            </Text>

            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyCode}
            >
              <MaterialCommunityIcons
                name="content-copy"
                size={16}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 16,
  },
  image: {
    width: "100%",
    height: 120,
  },
  contentContainer: {
    padding: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: "space-between",
  },
  code: {
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  copyButton: {
    padding: 4,
  },
});

export default PromotionCard;
