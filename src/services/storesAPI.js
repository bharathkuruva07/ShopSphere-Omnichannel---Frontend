/**
 * Stores API Service Module
 *
 * This module provides API communication for store management.
 * It handles all CRUD operations for stores using the backend API.
 *
 * Base URL: http://localhost:9090/api/stores
 *
 * @module services/storesAPI
 */

import axios from "axios";

/**
 * Base URL for Stores API
 * Points to the backend stores endpoint
 */
const STORES_API_BASE_URL = "http://localhost:9090/api/stores";

/**
 * Create Axios instance for Stores API
 */
const storesApiClient = axios.create({
  baseURL: STORES_API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request Interceptor
 * Adds authentication token and user role to request headers if available
 */
storesApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add X-User-Role header
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        config.headers["X-User-Role"] = user.role || "CUSTOMER";
      } catch (e) {
        config.headers["X-User-Role"] = "CUSTOMER";
      }
    } else {
      config.headers["X-User-Role"] = "CUSTOMER";
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Standardizes response handling and error management
 */
storesApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/**
 * STORES API ENDPOINTS
 */
export const storesAPI = {
  /**
   * Fetch all stores with pagination
   * @param {Object} params - Query parameters (pageNumber, pageSize, etc.)
   * @returns {Promise} Paginated stores list
   */
  getAllStores: (params = {}) =>
    storesApiClient.get("", { params }),

  /**
   * Create new store
   * @param {Object} storeData - Store details (name, address)
   * @returns {Promise} Created store
   */
  createStore: (storeData) =>
    storesApiClient.post("", storeData),

  /**
   * Update existing store
   * @param {number} id - Store ID
   * @param {Object} storeData - Updated store details
   * @returns {Promise} Updated store
   */
  updateStore: (id, storeData) =>
    storesApiClient.put(`/${id}`, storeData),

  /**
   * Delete store
   * @param {number} id - Store ID
   * @returns {Promise} Deletion confirmation
   */
  deleteStore: (id) =>
    storesApiClient.delete(`/${id}`),
};

export default storesAPI;
