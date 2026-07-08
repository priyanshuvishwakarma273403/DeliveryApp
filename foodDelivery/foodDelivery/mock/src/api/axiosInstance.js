import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach JWT Token automatically
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("mock_accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Global API Errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      
      // If unauthorized (invalid/expired JWT)
      if (status === 417 || status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("mock_accessToken");
          localStorage.removeItem("mock_user");
          // Dispatch custom event to let AuthContext know about logout
          window.dispatchEvent(new Event("auth-logout"));
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
