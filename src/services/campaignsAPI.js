import axios from 'axios';

// Campaign service backend URL
const API_BASE_URL = 'http://localhost:9090/api/campaigns';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * REQUEST INTERCEPTOR
 * Automatically attaches the authToken from localStorage to every request.
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Add user role header for authorization
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        config.headers["X-User-Role"] = user.role || "ADMIN";
      } catch (e) {
        config.headers["X-User-Role"] = "ADMIN";
      }
    } else {
      config.headers["X-User-Role"] = "ADMIN";
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR
 * Handle common errors like 401 Unauthorized
 */
apiClient.interceptors.response.use(
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

/**
 * Campaign API Service
 * Connects to campaign-service backend at port 8084
 */
export const campaignsAPI = {
  /**
   * Get all campaigns with pagination
   * GET /api/campaigns
   */
  getAllCampaigns: async (page = 0, size = 10, sortBy = 'id', sortDir = 'desc') => {
    const response = await apiClient.get('', {
      params: { page, size, sortBy, sortDir }
    });
    return response.data;
  },

  /**
   * Get campaign statistics (totals for dashboard)
   * GET /api/campaigns/statistics
   */
  getStatistics: async () => {
    const response = await apiClient.get('/statistics');
    return response.data;
  },

  // ==========================================
  // WRITE / MANAGEMENT ENDPOINTS
  // ==========================================

  /**
   * Create a new campaign
   * POST /api/campaigns
   */
  createCampaign: async (campaignData) => {
    const response = await apiClient.post('', campaignData);
    return response.data;
  },

  /**
   * Update an existing campaign
   * PUT /api/campaigns/{id}
   */
  updateCampaign: async (id, campaignData) => {
    const response = await apiClient.put(`/${id}`, campaignData);
    return response.data;
  },

  /**
   * Update campaign status only
   * PATCH /api/campaigns/{id}/status
   */
  updateCampaignStatus: async (id, status) => {
    const response = await apiClient.patch(`/${id}/status`, null, {
      params: { status }
    });
    return response.data;
  },

  /**
   * Delete a campaign
   * DELETE /api/campaigns/{id}
   */
  deleteCampaign: async (id) => {
    const response = await apiClient.delete(`/${id}`);
    return response.data;
  }
};

/**
 * Handle API errors consistently
 */
export const handleCampaignApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || 
                    error.response.data?.error || 
                    `Error: ${error.response.status}`;
    return { message, status: error.response.status };
  } else if (error.request) {
    // Request made but no response
    return { message: 'Campaign service is not responding. Please try again later.', status: 503 };
  } else {
    // Request setup error
    return { message: error.message || 'An unexpected error occurred', status: 500 };
  }
};

export default campaignsAPI;
