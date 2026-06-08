import axios from 'axios';

const API_BASE_URL ='http://localhost:9090/api/products'; // Update this to your actual API base URL
// Configure your base URL here
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const productAPI = {
  // ==========================================
  // PUBLIC ENDPOINTS
  // ==========================================

  // GET /api/products/{id}
  getProductById: async (id) => {
    const response = await apiClient.get(`/${id}`);
    return response.data;
  },

  // GET /api/products
  getAllProducts: async (page = 0, size = 12, sortBy = 'id', sortDir = 'asc') => {
    const response = await apiClient.get('', { params: { page, size, sortBy, sortDir } });
    return response.data;
  },

  // GET /api/products/search
  searchProducts: async (q, page = 0, size = 10, sortBy = 'name', sortDir = 'asc') => {
    const response = await apiClient.get('/search', { params: { q, page, size, sortBy, sortDir } });
    return response.data;
  },

  // GET /api/products/category/{category}
  getProductsByCategory: async (category, page = 0, size = 10, sortBy = 'name', sortDir = 'asc') => {
    const response = await apiClient.get(`/category/${category}`, { params: { page, size, sortBy, sortDir } });
    return response.data;
  },

  // ==========================================
  // ADMIN ENDPOINTS (Requires X-User-Role: ADMIN)
  // ==========================================

  // POST /api/products
  createProduct: async (productData, userRole) => {
    const response = await apiClient.post('', productData, {
      headers: { 'X-User-Role': userRole }
    });
    return response.data;
  },

  // PUT /api/products/{id}
  updateProduct: async (id, productData, userRole) => {
    const response = await apiClient.put(`/${id}`, productData, {
      headers: { 'X-User-Role': userRole }
    });
    return response.data;
  },

  // DELETE /api/products/{id}
  deleteProduct: async (id, userRole) => {
    const response = await apiClient.delete(`/${id}`, {
      headers: { 'X-User-Role': userRole }
    });
    return response.data;
  },
};