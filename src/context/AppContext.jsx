import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { handleApiError } from "../services/api";
import dashboardAPI from "../services/dashboardAPI";
import authAPI from "../services/authAPI";
import { productAPI } from "../services/productAPI.JS";
import { campaignsAPI, handleCampaignApiError } from "../services/campaignsAPI";
import { ordersAPI } from "../services/ordersAPI";
import { storesAPI } from "../services/storesAPI";
import axios from "axios";

const AppContext = createContext();

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const initialValueRef = useRef(initialValue);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      try {
        if (storedValue === undefined || storedValue === null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify(storedValue));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    }, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [key, storedValue]);

  const setValue = useCallback(
    (value) => {
      setStoredValue((prev) => {
        try {
          return value instanceof Function ? value(prev) : value;
        } catch (error) {
          console.error(`Error updating localStorage key "${key}":`, error);
          return prev;
        }
      });
    },
    [key],
  );

  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setStoredValue(initialValueRef.current);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue, removeValue];
}

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser, removeCurrentUser] = useLocalStorage(
    "currentUser",
    null,
  );
  const [cart, setCart, removeCart] = useLocalStorage("cart", []);
  const [loyaltyPoints, setLoyaltyPoints, removeLoyaltyPoints] =
    useLocalStorage("loyaltyPoints", 0);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [campaigns, setCampaigns] = useState([]);
  const [stores, setStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storesPagination, setStoresPagination] = useState({
    pageNumber: 0,
    pageSize: 10,
    totalElements: 0,
    totalPages: 0,
  });
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    orderStats: null,
    productStats: null,
    storeStats: null,
    campaignStats: null,
    campaigns: [],
  });

  // Campaign state
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignStats, setCampaignStats] = useState({
    totalCampaigns: 0,
    totalBudget: 0,
    totalRevenue: 0,
  });
  const [campaignPagination, setCampaignPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    pageSize: 10,
  });

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    setError(null);
    try {
      const response = await productAPI.getAllProducts();
      setProducts(response.data.content || []);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const fetchProductsPage = useCallback(
    async (page = 1, size = 10, searchTerm = "", category = "All") => {
      setProductsLoading(true);
      setError(null);
      try {
        const pageIndex = Math.max(0, page - 1); // Convert 1-indexed to 0-indexed
        let response;

        if (searchTerm && searchTerm.trim() !== "") {
          // Search products
          response = await productAPI.searchProducts(
            searchTerm.trim(),
            pageIndex,
            size,
          );
        } else if (category && category !== "All") {
          // Get products by category
          response = await productAPI.getProductsByCategory(
            category,
            pageIndex,
            size,
          );
        } else {
          // Get all products
          response = await productAPI.getAllProducts(pageIndex, size);
        }

        // Normalize response structure
        const data = response || {};
        return {
          content: data.content || data.data?.content || [],
          totalElements: data.totalElements ?? data.data?.totalElements ?? 0,
          totalPages: data.totalPages ?? data.data?.totalPages ?? 0,
        };
      } catch (err) {
        const apiError = handleApiError(err);
        setError(apiError.message);
        throw apiError;
      } finally {
        setProductsLoading(false);
      }
    },
    [],
  );

  const searchProductsByTerm = useCallback(
    async (searchTerm, page = 1, size = 10) => {
      return fetchProductsPage(page, size, searchTerm, "All");
    },
    [fetchProductsPage],
  );

  const getProductsByCategoryPaginated = useCallback(
    async (category, page = 1, size = 10) => {
      return fetchProductsPage(page, size, "", category);
    },
    [fetchProductsPage],
  );

  useEffect(() => {
    // Sync loyaltyPoints from currentUser on mount
    if (currentUser?.loyaltyPoints !== undefined) {
      setLoyaltyPoints(currentUser.loyaltyPoints);
    }
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (currentUser) {
      setOrdersLoading(true);
      (async () => {
        try {
          // NOTE: Orders are now fetched via ordersAPI.js for backend integration
          // This effect can be used for local state management
          setOrdersLoading(false);
        } catch (err) {
          console.error("Failed to fetch orders");
          setOrdersLoading(false);
        }
      })();
    }
  }, [currentUser]);

  // Product methods
  const getProductById = useCallback(
    (id) => products.find((p) => p.id === id),
    [products],
  );

  const addProduct = useCallback(
    async (data) => {
      setIsLoading(true);
      try {
        const response = await productAPI.createProduct(data, "ADMIN");
        // Backend returns { success, message, data: {...}, timestamp }
        const productData = response.data || response;
        setProducts([...products, productData]);
        return productData;
      } catch (err) {
        throw handleApiError(err);
      } finally {
        setIsLoading(false);
      }
    },
    [products],
  );

  const updateProduct = useCallback(
    async (id, updates) => {
      setIsLoading(true);
      try {
        const response = await productAPI.updateProduct(id, updates, "ADMIN");
        // Backend returns { success, message, data: {...}, timestamp }
        const productData = response.data || response;
        setProducts(products.map((p) => (p.id === id ? productData : p)));
        return productData;
      } catch (err) {
        throw handleApiError(err);
      } finally {
        setIsLoading(false);
      }
    },
    [products],
  );

  const deleteProduct = useCallback(
    async (id) => {
      setIsLoading(true);
      try {
        await productAPI.deleteProduct(id, "ADMIN");
        setProducts(products.filter((p) => p.id !== id));
      } catch (err) {
        throw handleApiError(err);
      } finally {
        setIsLoading(false);
      }
    },
    [products],
  );

  // ===== AUTHENTICATION METHODS =====
  //
  const checkEmail = async (email) => {
    try {
      const response = await authAPI.checkEmailExists(email);
      // Returns true if the list in response.data is not empty
      return response.data;
    } catch (err) {
      console.error(err);
    }
  };

  const updatePassword = async (email, newPassword) => {
    try {
      const response = await authAPI.updatePassword(email, newPassword);
      return response.data;
    } catch (err) {
      console.error("Failed to update password:", err);
      // Extract backend error message if available
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to update password. Please try again.";
      throw new Error(message);
    }
  };

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const credentials = {
        email: email,
        password: password,
      };
      console.log(credentials);

      const response = await authAPI.login(credentials);
      console.log(response.data.data);

      if (!response.data.data) throw new Error("Invalid server response");

      const { token, tokenType, userId, ...rest } = response.data.data;

      if (!token) throw new Error("No token received");

      // 1. Store the REAL JWT token
      localStorage.setItem("authToken", token);

      // 2. Set default header
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // 3. Map backend response to frontend user object (userId -> id)
      const customer = { id: userId, ...rest };
      setCurrentUser(customer);
      return response;
    } catch (err) {
      console.error("Login error:", err);
      const msg = err.response?.data?.message || err.message || "Login failed.";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    removeCurrentUser();
    removeCart();
    removeLoyaltyPoints();
    setOrders([]);
    localStorage.removeItem("authToken");
  }, [removeCurrentUser, removeCart, removeLoyaltyPoints]);

  const signup = useCallback(async (userData) => {
    setIsLoading(true);
    setError(null);
    try {
      const createResponse = await authAPI.register(userData);
      return createResponse.data;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || "Signup failed.");
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===== OTP / PASSWORD RECOVERY LOGIC =====
  const triggerOtp = useCallback(async (email) => {
    setIsLoading(true);
    setError(null);
    try {
      // Call the backend to send the OTP email
      // The backend should throw an error 404 if email doesn't exist
      const response = await authAPI.sendOtp(email);
      return response.data; // Return success message
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateOtp = useCallback(async (email, otp) => {
    setIsLoading(true);
    setError(null);
    try {
      // 2. Call backend to verify the code
      const response = await authAPI.verifyOtp(email, otp);
      return response.data; // Should return true/success/token
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===== CART METHODS (FIXED) =====
  const addToCart = useCallback((product, qty = 1) => {
    setCart((prev) => {
      const exist = prev.find((i) => i.id === product.id);
      if (exist) {
        const newQuantity = exist.quantity + qty;
        if (newQuantity <= 0) {
          return prev.filter((i) => i.id !== product.id);
        }
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: newQuantity } : i,
        );
      }
      return qty > 0 ? [...prev, { ...product, quantity: qty }] : prev;
    });
  }, []);

  const removeFromCart = useCallback(
    (id) => setCart((prev) => prev.filter((i) => i.id !== id)),
    [],
  );

  const updateCartQuantity = useCallback(
    (id, qty) => {
      if (qty <= 0) removeFromCart(id);
      else
        setCart((prev) =>
          prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)),
        );
    },
    [removeFromCart],
  );

  const clearCart = useCallback(() => setCart([]), []);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      setOrdersLoading(false);
    } catch (err) {
      setError(handleApiError(err).message);
      setOrdersLoading(false);
    }
  }, []);

  // ===== ORDER METHODS (Backend Integration) =====

  /**
   * Fetch all orders (admin only) with pagination
   */
  const fetchAllOrders = useCallback(async (params = {}) => {
    setOrdersLoading(true);
    try {
      const response = await ordersAPI.getAllOrders("ADMIN", {
        page: params.page || 0,
        size: params.size || 100,
        sortBy: params.sortBy || "createdAt",
        sortDir: params.sortDir || "desc",
      });
      const ordersList =
        response.data?.data?.content || response.data?.data || [];
      return ordersList;
    } catch (err) {
      console.error("Failed to fetch all orders:", err);
      throw err;
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  /**
   * Fetch current user's orders with pagination
   */
  const fetchMyOrders = useCallback(async (userId, params = {}) => {
    setOrdersLoading(true);
    try {
      const response = await ordersAPI.getMyOrders(userId, {
        page: params.page || 0,
        size: params.size || 100,
        sortBy: params.sortBy || "createdAt",
        sortDir: params.sortDir || "desc",
      });
      const ordersList =
        response.data?.data?.content || response.data?.data || [];
      return ordersList;
    } catch (err) {
      console.error("Failed to fetch user orders:", err);
      throw err;
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  /**
   * Create a new order via backend
   */
  const createBackendOrder = useCallback(async (orderData, userId) => {
    setIsLoading(true);
    try {
      const response = await ordersAPI.createOrder(orderData, userId);
      return response.data;
    } catch (err) {
      console.error("Failed to create order:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update order status via backend (admin only)
   */
  const updateBackendOrderStatus = useCallback(
    async (orderId, status, trackingStatus) => {
      setIsLoading(true);
      try {
        await ordersAPI.updateOrderStatus(
          orderId,
          status,
          "ADMIN",
          trackingStatus,
        );
        // Also update local state if the order exists there
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status,
                  trackingStatus: trackingStatus || o.trackingStatus,
                  updatedAt: new Date().toISOString(),
                }
              : o,
          ),
        );
      } catch (err) {
        console.error("Failed to update order status:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ===== STORE METHODS (Backend Integration) =====

  /**
   * Fetch all stores with pagination
   */
  const fetchStores = useCallback(async (params = {}) => {
    setStoresLoading(true);
    try {
      const response = await storesAPI.getAllStores({
        pageNumber: params.pageNumber || 0,
        pageSize: params.pageSize || 10,
      });
      if (response.data?.success) {
        const { content, pageNumber, pageSize, totalElements, totalPages } =
          response.data.data;
        setStores(content || []);
        setStoresPagination({
          pageNumber,
          pageSize,
          totalElements,
          totalPages,
        });
        return response.data;
      }
      return response.data;
    } catch (err) {
      console.error("Failed to fetch stores:", err);
      throw err;
    } finally {
      setStoresLoading(false);
    }
  }, []);

  /**
   * Create a new store
   */
  const createStore = useCallback(
    async (storeData) => {
      setIsLoading(true);
      try {
        const response = await storesAPI.createStore(storeData);
        if (response.data?.success) {
          // Refetch stores to get updated list
          await fetchStores({
            pageNumber: storesPagination.pageNumber,
            pageSize: storesPagination.pageSize,
          });
        }
        return response.data;
      } catch (err) {
        console.error("Failed to create store:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchStores, storesPagination],
  );

  /**
   * Update an existing store
   */
  const updateStore = useCallback(async (id, storeData) => {
    setIsLoading(true);
    try {
      const response = await storesAPI.updateStore(id, storeData);
      if (response.data?.success) {
        setStores((prev) =>
          prev.map((s) => (s.id === id ? response.data.data : s)),
        );
      }
      return response.data;
    } catch (err) {
      console.error("Failed to update store:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete a store
   */
  const deleteStore = useCallback(async (id) => {
    setIsLoading(true);
    try {
      const response = await storesAPI.deleteStore(id);
      if (response.data?.success) {
        setStores((prev) => prev.filter((s) => s.id !== id));
        setStoresPagination((prev) => ({
          ...prev,
          totalElements: prev.totalElements - 1,
        }));
      }
      return response.data;
    } catch (err) {
      console.error("Failed to delete store:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const placeOrder = useCallback(
    async (orderData) => {
      setIsLoading(true);
      setError(null);
      try {
        const newOrder = {
          id: `ORD-${Date.now()}`,
          userId: currentUser?.id,
          items: cart,
          total: orderData.total,
          status: "pending",
          trackingStatus: "Order Placed",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          shippingAddress: orderData.shippingAddress,
          paymentMethod: orderData.paymentMethod,
          usedLoyaltyPoints: orderData.usedLoyaltyPoints || 0,
          loyaltyPointsUsed: orderData.usedLoyaltyPoints || 0,
          loyaltyDiscount: orderData.loyaltyDiscount || 0,
          shipping: orderData.shipping || 0,
          deliveryMethod: orderData.deliveryMethod,
          storeId: orderData.storeId || null,
          storeName: orderData.storeName || null,
          storeAddress: orderData.storeAddress || null,
        };

        // NOTE: Order creation is handled by ordersAPI.js in Cart.jsx
        // Local state update for UI consistency
        console.log(orders);
        console.log("newOrder" + newOrder);
        setOrders((prev) => [...prev, newOrder]);

        for (const cartItem of cart) {
          try {
            const productResponse = await productAPI.getProductById(
              cartItem.id,
            );
            const currentProduct = productResponse.data;
            const updatedProduct = {
              ...currentProduct,
              stock: Math.max(
                0,
                (currentProduct.stock || 0) - cartItem.quantity,
              ),
            };
            await productAPI.updateProduct(cartItem.id, updatedProduct);

            setProducts((prev) =>
              prev.map((p) => (p.id === cartItem.id ? updatedProduct : p)),
            );
          } catch (err) {
            console.warn(
              `Failed to update stock for product ${cartItem.id}:`,
              err,
            );
          }
        }

        const subtotal = cart.reduce(
          (acc, item) => acc + item.price * item.quantity,
          0,
        );
        // Earn 10 loyalty points for every ₹100 spent
        const earnedPoints = Math.floor(subtotal / 100) * 10;

        if (currentUser && currentUser.id) {
          try {
            // Calculate net points change: earned points minus used points
            const pointsToDeduct = orderData.usedLoyaltyPoints || 0;
            const netPointsChange = earnedPoints - pointsToDeduct;

            // Single PATCH call to update loyalty points (positive = add, negative = deduct)
            if (netPointsChange !== 0) {
              await authAPI.updateLoyaltyPoints(
                currentUser.id,
                netPointsChange,
              );
            }

            // Fetch updated user data from backend to get accurate loyalty points
            const userResponse = await authAPI.getCustomerById(currentUser.id);
            const updatedUser = userResponse.data?.data || userResponse.data;

            if (updatedUser) {
              const newLoyaltyPoints = updatedUser.loyaltyPoints || 0;

              // Update local state with backend data
              setCurrentUser((prev) => ({
                ...prev,
                loyaltyPoints: newLoyaltyPoints,
              }));
              setLoyaltyPoints(newLoyaltyPoints);

              // Also update localStorage to persist across page refreshes
              const storedUser = JSON.parse(
                localStorage.getItem("currentUser") || "{}",
              );
              localStorage.setItem(
                "currentUser",
                JSON.stringify({
                  ...storedUser,
                  loyaltyPoints: newLoyaltyPoints,
                }),
              );
            }
          } catch (loyaltyErr) {
            console.warn("Failed to update loyalty points:", loyaltyErr);
            // Fallback: calculate locally if backend fails
            const currentPts = currentUser.loyaltyPoints || 0;
            const pointsToDeduct = orderData.usedLoyaltyPoints || 0;
            const newTotalPoints = Math.max(
              0,
              currentPts - pointsToDeduct + earnedPoints,
            );

            setCurrentUser((prev) => ({
              ...prev,
              loyaltyPoints: newTotalPoints,
            }));
            setLoyaltyPoints(newTotalPoints);
          }
        }

        setCart([]);
        return newOrder;
      } catch (err) {
        const apiError = handleApiError(err);
        setError(apiError.message);
        throw apiError;
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser, cart],
  );

  const updateOrderStatus = useCallback(
    async (id, status, track) => {
      setIsLoading(true);
      try {
        const order = orders.find((o) => o.id === id);
        if (!order) throw new Error("Order not found");
        const updated = {
          ...order,
          status,
          trackingStatus: track || order.trackingStatus,
          updatedAt: new Date().toISOString(),
        };
        // NOTE: Order updates are handled by ordersAPI.js in OrderFulfillment.jsx
        // Local state update for UI consistency
        setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
        return response.data;
      } catch (err) {
        throw handleApiError(err);
      } finally {
        setIsLoading(false);
      }
    },
    [orders],
  );

  const fetchDashboardData = useCallback(async () => {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const data = await dashboardAPI.getAllDashboardStats();
      setDashboardData(data);
    } catch (err) {
      const apiError = handleApiError(err);
      setDashboardError(apiError.message);
      setDashboardData({
        orderStats: null,
        productStats: null,
        storeStats: null,
        campaignStats: null,
        campaigns: [],
      });
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  // ===== CAMPAIGN METHODS =====

  /**
   * Fetch campaigns with pagination and auto-status sync
   */
  const fetchCampaigns = useCallback(async (page = 0, pageSize = 10) => {
    setCampaignsLoading(true);
    try {
      const res = await campaignsAPI.getAllCampaigns(page, pageSize);
      const fetchedCampaigns = res.data?.content || res.content || [];

      // Get current date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];

      // Identify campaigns that need a status sync
      const statusUpdates = fetchedCampaigns.map(async (camp) => {
        let targetStatus = camp.status;

        // Check if it should be COMPLETED
        if (camp.endDate < today && camp.status !== "Completed") {
          targetStatus = "Completed";
        }
        // Check if it should be ACTIVE (if it was Scheduled/Pending)
        else if (
          camp.startDate <= today &&
          camp.endDate >= today &&
          camp.status !== "Active"
        ) {
          targetStatus = "Active";
        }

        // If a change is needed, update status
        if (targetStatus !== camp.status) {
          try {
            await campaignsAPI.updateCampaignStatus(camp.id, targetStatus);
            return { ...camp, status: targetStatus };
          } catch (err) {
            console.error(`Failed to update status for ${camp.name}`, err);
            return camp;
          }
        }
        return camp;
      });

      // Wait for all status syncs to finish
      const updatedList = await Promise.all(statusUpdates);

      setCampaigns(updatedList);
      setCampaignPagination({
        currentPage: res.data?.pageNumber ?? res.pageNumber ?? page,
        totalPages: res.data?.totalPages ?? res.totalPages ?? 0,
        pageSize,
      });

      // Refresh stats after fetching campaigns
      fetchCampaignStats();

      return updatedList;
    } catch (err) {
      console.error(
        "Failed to fetch campaigns:",
        handleCampaignApiError(err).message,
      );
      throw err;
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  /**
   * Fetch campaign statistics for dashboard cards
   */
  const fetchCampaignStats = useCallback(async () => {
    try {
      const res = await campaignsAPI.getStatistics();
      setCampaignStats(res.data || res);
    } catch (err) {
      console.error("Failed to fetch campaign stats:", err);
    }
  }, []);

  /**
   * Create a new campaign
   */
  const createCampaign = useCallback(
    async (campaignData) => {
      setCampaignsLoading(true);
      try {
        const newCampaign = {
          ...campaignData,
          budget: Number(campaignData.budget),
          revenueGenerated: 0,
          status: "ACTIVE",
        };
        const result = await campaignsAPI.createCampaign(newCampaign);
        await fetchCampaigns(
          campaignPagination.currentPage,
          campaignPagination.pageSize,
        );
        return result;
      } catch (err) {
        throw handleCampaignApiError(err);
      } finally {
        setCampaignsLoading(false);
      }
    },
    [fetchCampaigns, campaignPagination],
  );

  /**
   * Update an existing campaign
   */
  const updateCampaign = useCallback(
    async (id, campaignData) => {
      setCampaignsLoading(true);
      try {
        const result = await campaignsAPI.updateCampaign(id, {
          ...campaignData,
          budget: Number(campaignData.budget),
        });
        await fetchCampaigns(
          campaignPagination.currentPage,
          campaignPagination.pageSize,
        );
        return result;
      } catch (err) {
        throw handleCampaignApiError(err);
      } finally {
        setCampaignsLoading(false);
      }
    },
    [fetchCampaigns, campaignPagination],
  );

  /**
   * Delete a campaign
   */
  const deleteCampaign = useCallback(
    async (id) => {
      setCampaignsLoading(true);
      try {
        await campaignsAPI.deleteCampaign(id);
        await fetchCampaigns(
          campaignPagination.currentPage,
          campaignPagination.pageSize,
        );
      } catch (err) {
        throw handleCampaignApiError(err);
      } finally {
        setCampaignsLoading(false);
      }
    },
    [fetchCampaigns, campaignPagination],
  );

  /**
   * Add revenue to a campaign
   */
  const addCampaignRevenue = useCallback(
    async (campaign, additionalRevenue) => {
      setCampaignsLoading(true);
      try {
        const currentRevenue = Number(campaign.revenueGenerated || 0);
        const updatedData = {
          ...campaign,
          revenueGenerated: currentRevenue + Number(additionalRevenue),
        };
        const result = await campaignsAPI.updateCampaign(
          campaign.id,
          updatedData,
        );
        await fetchCampaigns(
          campaignPagination.currentPage,
          campaignPagination.pageSize,
        );
        return result;
      } catch (err) {
        throw handleCampaignApiError(err);
      } finally {
        setCampaignsLoading(false);
      }
    },
    [fetchCampaigns, campaignPagination],
  );

  const getOrderById = useCallback(
    (id) => orders.find((o) => o.id === id),
    [orders],
  );

  // Refresh user data from backend (useful for getting updated loyalty points)
  const refreshUserData = useCallback(async () => {
    if (!currentUser?.id) return null;

    try {
      const response = await authAPI.getCustomerById(currentUser.id);
      const updatedUser = response.data?.data || response.data;

      if (updatedUser) {
        const newLoyaltyPoints = updatedUser.loyaltyPoints || 0;

        setCurrentUser((prev) => ({
          ...prev,
          ...updatedUser,
          loyaltyPoints: newLoyaltyPoints,
        }));
        setLoyaltyPoints(newLoyaltyPoints);

        // Update localStorage
        const storedUser = JSON.parse(
          localStorage.getItem("currentUser") || "{}",
        );
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            ...storedUser,
            ...updatedUser,
            loyaltyPoints: newLoyaltyPoints,
          }),
        );

        return updatedUser;
      }
    } catch (err) {
      console.warn("Failed to refresh user data:", err);
    }
    return null;
  }, [currentUser?.id]);

  const value = {
    currentUser,
    isLoading,
    error,
    products,
    productsLoading,
    fetchProducts,
    fetchProductsPage,
    searchProductsByTerm,
    getProductsByCategoryPaginated,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    orders,
    ordersLoading,
    fetchOrders,
    fetchAllOrders,
    fetchMyOrders,
    createBackendOrder,
    updateBackendOrderStatus,
    placeOrder,
    updateOrderStatus,
    getOrderById,
    loyaltyPoints,
    refreshUserData,
    // Store methods
    stores,
    storesLoading,
    storesPagination,
    fetchStores,
    createStore,
    updateStore,
    deleteStore,
    login,
    signup,
    logout,
    dashboardLoading,
    dashboardError,
    dashboardData,
    fetchDashboardData,
    // Campaign methods
    campaigns,
    campaignsLoading,
    campaignStats,
    campaignPagination,
    fetchCampaigns,
    fetchCampaignStats,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    addCampaignRevenue,
    triggerOtp,
    validateOtp,
    checkEmail,
    updatePassword,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

export default AppContext;
