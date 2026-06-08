/**
 * Dashboard API Service
 * Fetches aggregated statistics from each microservice's /dashboard-stats endpoint
 * via the API Gateway at http://localhost:9090
 */

import axios from "axios";

const GATEWAY_URL = "http://localhost:9090";

const dashClient = axios.create({
  baseURL: GATEWAY_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request Interceptor — attaches JWT + admin role header
 */
dashClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // X-User-Role is injected by the API Gateway from JWT claims
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor — log errors but do NOT redirect on 401.
 * Dashboard uses Promise.allSettled so individual failures are handled gracefully.
 * The main api.js interceptor handles session-level 401 logout.
 */
dashClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Dashboard API 401 — token may be expired or missing.");
    }
    return Promise.reject(error);
  }
);

/**
 * Dashboard API methods
 */
const dashboardAPI = {
  /**
   * Fetches all dashboard data in parallel from all services
   * Returns a combined object with stats from every service
   */
  getAllDashboardStats: async () => {
    const [orderRes, productRes, storeRes, campaignListRes] = await Promise.allSettled([
      dashClient.get("/api/orders/dashboard-stats"),
      dashClient.get("/api/products/dashboard-stats"),
      dashClient.get("/api/stores/dashboard-stats"),
      dashClient.get("/api/campaigns?page=0&size=8"), // Fetch campaigns for performance chart
    ]);

    // Extract campaigns list from response
    const campaignListData = campaignListRes.status === "fulfilled" 
      ? (campaignListRes.value.data?.data?.content || campaignListRes.value.data?.content || [])
      : [];

    return {
      orderStats: orderRes.status === "fulfilled" ? orderRes.value.data?.data : null,
      productStats: productRes.status === "fulfilled" ? productRes.value.data?.data : null,
      storeStats: storeRes.status === "fulfilled" ? storeRes.value.data?.data : null,
      campaigns: campaignListData,
    };
  },
};

export default dashboardAPI;
