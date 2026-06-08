/**
 * Orders API Service
 * Handles all API calls to the backend order-service at http://localhost:9090/api/orders
 */

import axios from "axios";

const ORDER_BASE_URL = "http://localhost:9090/api/orders";

const orderClient = axios.create({
  baseURL: ORDER_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request Interceptor
 * Adds authentication token to request headers if available
 */
orderClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

        const currentUser = localStorage.getItem("currentUser");
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles error responses
 */
orderClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const ordersAPI = {
  /**
   * Create new order
   * @param {Object} orderData - Order details with items, total, shippingAddress, paymentMethod
   * @param {number} userId - Current user ID
   * @returns {Promise} Created order response
   */
  createOrder: (orderData, userId) =>
    orderClient.post("/createorder", orderData, {
      headers: { "X-User-Id": userId,
        "X-User-Role": "CUSTOMER",
        "X-Requested-With": "XMLHttpRequest"
       },

    }),

  /**
   * Get current user's orders with pagination
   * @param {number} userId - Current user ID
   * @param {Object} params - Query parameters (page, size, sortBy, sortDir)
   * @returns {Promise} Paginated orders
   */
  getMyOrders: (userId, params = {}) =>
    orderClient.get("/my-orders", {
      headers: { "X-User-Id": userId },
      params: {
        page: params.page || 0,
        size: params.size || 10,
        sortBy: params.sortBy || "createdAt",
        sortDir: params.sortDir || "desc",
      },
    }),

  /**
   * Get all orders (admin only) with pagination
   * @param {string} userRole - User role (must be ADMIN)
   * @param {Object} params - Query parameters (page, size, sortBy, sortDir, status)
   * @returns {Promise} Paginated orders
   */
  getAllOrders: (userRole = "ADMIN", params = {}) =>
    orderClient.get("/getall", {
      headers: { "X-User-Role": userRole },
      params: {
        page: params.page || 0,
        size: params.size || 10,
        sortBy: params.sortBy || "createdAt",
        sortDir: params.sortDir || "desc",
        status: params.status,
      },
    }),

  /**
   * Update order status (admin only)
   * @param {number} id - Order ID
   * @param {string} status - New status (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED)
   * @param {string} userRole - User role (must be ADMIN)
   * @param {string} trackingStatus - New tracking status (optional)
   * @returns {Promise} Updated order
   */
  updateOrderStatus: (id, status, userRole = "ADMIN", trackingStatus = null) => {
    const statusUpdateRequest = {
      status: status,
      trackingStatus: trackingStatus,
      reason: "Status updated by admin"
    };
    return orderClient.put(`/${id}/status`, statusUpdateRequest, {
      headers: { 
        "X-User-Role": userRole,
        "Content-Type": "application/json"
      },
    });
  },
};

export default ordersAPI;

