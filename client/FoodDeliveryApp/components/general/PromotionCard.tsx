import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ImageBackground,
  Alert,
  Clipboard,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import LinearGradient from "react-native-linear-gradient";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.8;
const CARD_HEIGHT = 160;

const PromotionCard = ({ title, description, image, code, onPress }: any) => {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);

  // Handle card press
  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  // Handle copy code
  const handleCopyCode = () => {
    if (code) {
      Clipboard.setString(code);
      setCopied(true);

      // Show temporary "Copied" state
      setTimeout(() => {
        setCopied(false);
      }, 2000);

      // Show alert
      Alert.alert(
        "Promotion Code Copied",
        `Code "${code}" has been copied to clipboard.`,
        [{ text: "OK" }]
      );
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, theme.shadow.md]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <ImageBackground
        source={{ uri: image }}
        style={styles.imageBackground}
        imageStyle={styles.image}
        resizeMode="cover"
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.7)", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.7)"]}
          style={styles.gradient}
        >
          <View style={styles.contentContainer}>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: theme.colors.white }]}>
                {title}
              </Text>
              <Text
                style={[styles.description, { color: theme.colors.white }]}
                numberOfLines={2}
              >
                {description}
              </Text>
            </View>

            {code && (
              <TouchableOpacity
                style={[
                  styles.codeContainer,
                  { backgroundColor: theme.colors.white },
                ]}
                onPress={handleCopyCode}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.codeText, { color: theme.colors.primary }]}
                >
                  {code}
                </Text>
                <MaterialCommunityIcons
                  name={copied ? "check" : "content-copy"}
                  size={16}
                  color={copied ? theme.colors.success : theme.colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 16,
  },
  imageBackground: {
    width: "100%",
    height: "100%",
  },
  image: {
    borderRadius: 12,
  },
  gradient: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 16,
  },
  contentContainer: {
    justifyContent: "space-between",
  },
  textContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    opacity: 0.9,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    borderRadius: 6,
  },
  codeText: {
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default PromotionCard;
