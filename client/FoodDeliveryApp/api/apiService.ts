import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";

// Create an axios instance with default configs
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Create a service with API methods
export const apiService = {
  // Generic request method
  async request(method: string, endpoint: any, data = null, config = {}) {
    try {
      const response = await apiClient({
        method,
        url: endpoint,
        data,
        ...config,
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("API Error:", error.response.data);
        throw error.response.data;
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
        throw new Error(
          "No response from server. Please check your internet connection."
        );
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Request error:", error.message);
        throw error;
      }
    }
  },

  // Convenience methods for common HTTP methods
  get(endpoint: string, config = {}) {
    return this.request("get", endpoint, null, config);
  },

  post(endpoint: string, data?: any, config = {}) {
    return this.request("post", endpoint, data, config);
  },

  put(endpoint: string, data: any, config = {}) {
    return this.request("put", endpoint, data, config);
  },

  patch(endpoint: string, data: any, config = {}) {
    return this.request("patch", endpoint, data, config);
  },

  delete(endpoint: string, config = {}) {
    return this.request("delete", endpoint, null, config);
  },

  upload: async (endpoint: string, formData: FormData) => {
    try {
      console.log(`Uploading to ${endpoint}...`);

      // Get authentication token
      const token = await getToken();
      console.log("Auth token available:", !!token);

      // Create request with proper headers
      const request = {
        method: "POST",
        headers: {
          // Don't set Content-Type for multipart/form-data
          // Let fetch set it automatically with the boundary
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      };

      console.log(`Sending request to ${API_BASE_URL}${endpoint}`);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, request);

      // Get response details for debugging
      const responseStatus = response.status;
      const responseStatusText = response.statusText;
      console.log(`Response status: ${responseStatus} ${responseStatusText}`);

      // Parse JSON response
      const data = await response.json();
      console.log("Response data:", JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error("Upload failed with status:", responseStatus);
        throw new Error(
          data.message || `Upload failed with status ${responseStatus}`
        );
      }

      return data;
    } catch (error) {
      console.error("API upload error:", error);
      throw error;
    }
  },
};

export default apiService;
