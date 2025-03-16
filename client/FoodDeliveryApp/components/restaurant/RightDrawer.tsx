import React, { useRef, useImperativeHandle, forwardRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
  Modal,
  StatusBar,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";

const { width, height } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.85;

const RightDrawer = forwardRef(({ title, content, onClose }: any, ref) => {
  const { theme } = useTheme();

  // Animation values
  const slideAnim = useRef(new Animated.Value(width)).current as any;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Track if drawer is open
  const isOpen = useRef(false);

  // Pan responder for swipe to close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dx > 20;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          slideAnim.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > DRAWER_WIDTH / 3) {
          close();
        } else {
          // Snap back to open position
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Open drawer
  const open = () => {
    isOpen.current = true;
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Close drawer
  const close = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isOpen.current = false;
      if (onClose) onClose();
    });
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    open,
    close,
    isOpen: () => isOpen.current,
  }));

  if (!isOpen.current && slideAnim._value === width) {
    return null;
  }

  return (
    <Modal transparent visible={true} animationType="none">
      <StatusBar
        backgroundColor="rgba(0, 0, 0, 0.5)"
        barStyle="light-content"
      />
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              backgroundColor: "black",
              opacity: backdropOpacity,
            },
          ]}
          onTouchEnd={close}
        />

        {/* Drawer */}
        <Animated.View
          style={[
            styles.drawer,
            {
              backgroundColor: theme.colors.background,
              transform: [{ translateX: slideAnim }],
              width: DRAWER_WIDTH,
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Header */}
          <View
            style={[styles.header, { borderBottomColor: theme.colors.border }]}
          >
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {title}
            </Text>
            <TouchableOpacity onPress={close} style={styles.closeButton}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>{content}</View>
        </Animated.View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  drawer: {
    height: "100%",
    position: "absolute",
    top: 0,
    right: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
});

export default RightDrawer;
