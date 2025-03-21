import React, { createContext, useState, useEffect, useContext } from "react";
import io, { Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { useLocation } from "./LocationContext";

interface OrderUpdate {
  type: string;
  [key: string]: any;
  timestamp: Date;
}

interface DeliveryUpdate {
  type: string;
  [key: string]: any;
  timestamp: Date;
}

interface RestaurantUpdate {
  type: string;
  [key: string]: any;
  timestamp: Date;
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  orderUpdates: OrderUpdate[];
  deliveryUpdates: DeliveryUpdate[];
  restaurantUpdates: RestaurantUpdate[];
  sendOrderStatusUpdate: (orderId: any, status: any, reason: any) => boolean;
  sendLocationUpdate: (orderId: any, lat: any, lng: any) => boolean;
  clearUpdate: (updateType: any, updateId: any) => void;
  clearAllUpdates: () => void;
}

export const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: any) => {
  let SOCKET_URL = "http://localhost:5000";
  const { user, accessToken, USER_ROLES, hasRole } = useAuth();
  const { currentLocation } = useLocation();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  interface OrderUpdate {
    type: string;
    [key: string]: any;
    timestamp: Date;
  }

  const [orderUpdates, setOrderUpdates] = useState<OrderUpdate[]>([]);
  interface DeliveryUpdate {
    type: string;
    [key: string]: any;
    timestamp: Date;
  }

  const [deliveryUpdates, setDeliveryUpdates] = useState<DeliveryUpdate[]>([]);
  interface RestaurantUpdate {
    type: string;
    [key: string]: any;
    timestamp: Date;
  }

  const [restaurantUpdates, setRestaurantUpdates] = useState<
    RestaurantUpdate[]
  >([]);

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (user && accessToken) {
      // Create socket connection
      const socketIo = io(SOCKET_URL, {
        auth: {
          token: accessToken,
        },
        transports: ["websocket"],
        autoConnect: true,
      });

      // Socket event handlers
      socketIo.on("connect", () => {
        console.log("Socket connected");
        setConnected(true);
      });

      socketIo.on("disconnect", () => {
        console.log("Socket disconnected");
        setConnected(false);
      });

      socketIo.on("error", (error) => {
        console.error("Socket error:", error);
      });

      // Listen for order status updates
      socketIo.on("order:status_updated", (data) => {
        setOrderUpdates((prev) => [
          ...prev,
          { type: "status", ...data, timestamp: new Date() },
        ]);
      });

      // Listen for new orders (restaurant owners)
      socketIo.on("order:new", (data) => {
        setRestaurantUpdates((prev) => [
          ...prev,
          { type: "new_order", ...data, timestamp: new Date() },
        ]);
      });

      // Listen for order cancellations (restaurant owners)
      socketIo.on("order:cancelled", (data) => {
        setRestaurantUpdates((prev) => [
          ...prev,
          { type: "cancelled", ...data, timestamp: new Date() },
        ]);
      });

      // Listen for delivery location updates (customers)
      socketIo.on("location:updated", (data) => {
        setDeliveryUpdates((prev) => [
          ...prev,
          { type: "location", ...data, timestamp: new Date() },
        ]);
      });

      // Listen for order assignments (delivery personnel)
      socketIo.on("order:assigned", (data) => {
        setDeliveryUpdates((prev) => [
          ...prev,
          { type: "assigned", ...data, timestamp: new Date() },
        ]);
      });

      // Store socket instance
      setSocket(socketIo);

      // Clean up on unmount
      return () => {
        socketIo.disconnect();
        setSocket(null);
        setConnected(false);
      };
    } else {
      // Disconnect if no user or token
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [user, accessToken]);

  // Auto-join rooms based on user role
  useEffect(() => {
    if (socket && connected && user) {
      // Join user-specific room
      socket.emit("join:user", { userId: user.id });

      // Join role-specific rooms
      if (hasRole(USER_ROLES.RESTAURANT_OWNER) && user.restaurantId) {
        socket.emit("join:restaurant", { restaurantId: user.restaurantId });
      }

      if (hasRole(USER_ROLES.DELIVERY_PERSON)) {
        socket.emit("join:delivery", { userId: user.id });
      }
    }
  }, [socket, connected, user]);

  // Update delivery location for delivery personnel
  useEffect(() => {
    if (
      socket &&
      connected &&
      user &&
      hasRole(USER_ROLES.DELIVERY_PERSON) &&
      currentLocation
    ) {
      // Get active deliveries for this delivery person
      const activeDeliveries = deliveryUpdates
        .filter((update) => update.type === "assigned")
        .map((update) => update.orderId);

      // Emit location updates for each active delivery
      activeDeliveries.forEach((orderId) => {
        socket.emit("location:update", {
          orderId,
          lat: (currentLocation as any).lat,
          lng: (currentLocation as any).lng,
        });
      });
    }
  }, [
    socket,
    connected,
    user,
    currentLocation,
    hasRole,
    USER_ROLES,
    deliveryUpdates,
  ]);

  // Clear updates on logout
  useEffect(() => {
    if (!user) {
      setOrderUpdates([]);
      setDeliveryUpdates([]);
      setRestaurantUpdates([]);
    }
  }, [user]);

  // Send order status update
  const sendOrderStatusUpdate = (orderId: any, status: any, reason: any) => {
    if (socket && connected) {
      socket.emit("order:status", { orderId, status, reason });
      return true;
    }
    return false;
  };

  // Send location update (for delivery personnel)
  const sendLocationUpdate = (orderId: any, lat: any, lng: any) => {
    if (socket && connected) {
      socket.emit("location:update", { orderId, lat, lng });
      return true;
    }
    return false;
  };

  // Clear specific update from state
  const clearUpdate = (updateType: any, updateId: any) => {
    switch (updateType) {
      case "order":
        setOrderUpdates((prev) =>
          prev.filter((update) => update.id !== updateId)
        );
        break;
      case "delivery":
        setDeliveryUpdates((prev) =>
          prev.filter((update) => update.id !== updateId)
        );
        break;
      case "restaurant":
        setRestaurantUpdates((prev) =>
          prev.filter((update) => update.id !== updateId)
        );
        break;
      default:
        break;
    }
  };

  // Clear all updates
  const clearAllUpdates = () => {
    setOrderUpdates([]);
    setDeliveryUpdates([]);
    setRestaurantUpdates([]);
  };

  const value = {
    socket,
    connected,
    orderUpdates,
    deliveryUpdates,
    restaurantUpdates,
    sendOrderStatusUpdate,
    sendLocationUpdate,
    clearUpdate,
    clearAllUpdates,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
