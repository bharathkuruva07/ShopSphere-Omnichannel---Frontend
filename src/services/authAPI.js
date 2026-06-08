import axios from "axios";

const API_URL = "http://localhost:9090/api";
const apiClient = axios.create({
  baseURL: API_URL, // Fixed from API_BASE_URL
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

 // Request Interceptor
 // Adds authentication token to request headers if available.
 // Required for customer endpoints that pass through the API Gateway's AuthenticationFilter.
 
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  },
);

const authAPI = {
  // Get customer by ID
  getCustomerById: (customerId) =>
    apiClient.get(`/customers/${customerId}`, {
      headers: { "X-User-Id": customerId },
    }),

  // Update loyalty points (positive = add, negative = deduct)
  updateLoyaltyPoints: (customerId, points) =>
    apiClient.patch(`/customers/${customerId}/loyalty-points`, {
      points: points,
    }),

  // --- Authentication ---

  register: (customerData) => apiClient.post(`/auth/register`, customerData),

  login: (credentials) => apiClient.post(`/auth/login`, credentials),

  sendOtp: (email) => apiClient.post(`/auth/send-otp`, { email }),

  verifyOtp: (email, otp) => apiClient.post(`/auth/verify-otp`, { email, otp }),

  checkEmailExists: (email) =>
    apiClient.get(`/auth/check-email`, {
      params: { email: email },
    }),

  updatePassword: (email, newPassword) =>
    apiClient.patch(`/auth/update-password`, {
      email: email,
      password: newPassword,
    }),
};

export default authAPI;
