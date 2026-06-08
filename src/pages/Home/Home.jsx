import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/Footer";
import {
  ShoppingCart,
  Star,
  Plus,
  Minus,
  ArrowRight,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import "./Home.css";

function Home() {
  // 1. Added currentUser to destructuring to check login status
  const { products, cart, addToCart, removeFromCart, currentUser, fetchProductsPage, searchProductsByTerm, getProductsByCategoryPaginated, productsLoading } = useApp();
  const navigate = useNavigate();

  // for Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [forYouMode, setForYouMode] = useState(false);

  // Pagination state (enabled by default)
  const [paginationEnabled] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 12;
  const [serverProducts, setServerProducts] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const [allForYouProducts, setAllForYouProducts] = useState([]);
  const [forYouLoaded, setForYouLoaded] = useState(false);

  const totalPages = Math.max(1, serverTotalPages);
  const normalizedPage = Math.max(1, Math.min(currentPage, totalPages));

  // Fetch page from backend using AppContext methods
  const fetchPage = async (page = 1) => {
    try {
      let response;

      if (searchTerm && searchTerm.trim() !== '') {
        response = await searchProductsByTerm(searchTerm.trim(), page, PRODUCTS_PER_PAGE);
        const { content, totalElements: total, totalPages: totalP } = response;
        setServerProducts(content || []);
        setTotalElements(total || 0);
        setServerTotalPages(totalP || 1);
      } else if (categoryFilter && categoryFilter !== 'All') {
        response = await getProductsByCategoryPaginated(categoryFilter, page, PRODUCTS_PER_PAGE);
        const { content, totalElements: total, totalPages: totalP } = response;
        setServerProducts(content || []);
        setTotalElements(total || 0);
        setServerTotalPages(totalP || 1);
      } else if (forYouMode) {
        // For "For You" mode: Get preferred categories and fetch that category (or all if user prefers multiple)
        const saved = localStorage.getItem("userPreferences");
        const preferredCategories = saved ? JSON.parse(saved).filter((p) => p.interested).map((p) => p.category) : [];
        
        if (preferredCategories.length === 0) {
          // No preferences set, fetch all products
          response = await fetchProductsPage(page, PRODUCTS_PER_PAGE, '', 'All');
          const { content, totalElements: total, totalPages: totalP } = response;
          setServerProducts(content || []);
          setTotalElements(total || 0);
          setServerTotalPages(totalP || 1);
        } else if (preferredCategories.length === 1) {
          // Single category preference - use server pagination
          response = await getProductsByCategoryPaginated(preferredCategories[0], page, PRODUCTS_PER_PAGE);
          const { content, totalElements: total, totalPages: totalP } = response;
          setServerProducts(content || []);
          setTotalElements(total || 0);
          setServerTotalPages(totalP || 1);
        } else {
          // Multiple categories - fetch in chunks of 12 and filter
          // Load all preferred category products in batches of 12
          if (!forYouLoaded) {
            const allProducts = [];
            let hasMore = true;
            let pageNum = 0;
            
            while (hasMore) {
              const data = await fetchProductsPage(pageNum + 1, 12, '', 'All');
              const filtered = (data.content || []).filter(p => preferredCategories.includes(p.category));
              allProducts.push(...filtered);
              
              if (!data.content || data.content.length < 12) {
                hasMore = false;
              }
              pageNum++;
            }
            
            setAllForYouProducts(allProducts);
            setForYouLoaded(true);
            
            // Now paginate the filtered results
            const startIdx = (page - 1) * PRODUCTS_PER_PAGE;
            setServerProducts(allProducts.slice(startIdx, startIdx + PRODUCTS_PER_PAGE));
            setTotalElements(allProducts.length);
            setServerTotalPages(Math.ceil(allProducts.length / PRODUCTS_PER_PAGE));
          } else if (allForYouProducts.length > 0) {
            // Use already loaded products
            const startIdx = (page - 1) * PRODUCTS_PER_PAGE;
            setServerProducts(allForYouProducts.slice(startIdx, startIdx + PRODUCTS_PER_PAGE));
            setTotalElements(allForYouProducts.length);
            setServerTotalPages(Math.ceil(allForYouProducts.length / PRODUCTS_PER_PAGE));
          }
        }
      } else {
        response = await fetchProductsPage(page, PRODUCTS_PER_PAGE, '', 'All');
        const { content, totalElements: total, totalPages: totalP } = response;
        setServerProducts(content || []);
        setTotalElements(total || 0);
        setServerTotalPages(totalP || 1);
      }
    } catch (err) {
      console.error('Failed to fetch products page', err);
    }
  };

  // Reset page and For You cache when search or category changes
  useEffect(() => {
    setCurrentPage(1);
    if (!forYouMode) {
      setForYouLoaded(false);
      setAllForYouProducts([]);
    }
  }, [searchTerm, categoryFilter, forYouMode]);

  // Fetch page whenever pagination is enabled and page/filters change
  useEffect(() => {
    if (paginationEnabled) {
      fetchPage(normalizedPage);
    }
  }, [paginationEnabled, normalizedPage, searchTerm, categoryFilter, forYouMode]);

  // unique categories for the dropdown
  const categories = ["All", "Electronics", "Accessories", "Fashion", "Home & Living"];

  // get preferred categories
  const getPreferredCategories = () => {
    const saved = localStorage.getItem("userPreferences");
    if (!saved) return [];
    const prefs = JSON.parse(saved);
    return prefs.filter((p) => p.interested).map((p) => p.category);
  };

  // Combined Filtering Logic for non-paginated mode
  let filteredProducts = paginationEnabled ? serverProducts : products.filter((p) => {
    const matchesSearch = p?.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (forYouMode) {
      const preferred = getPreferredCategories();
      const matchesPref =
        preferred.length === 0 || preferred.includes(p.category);
      return matchesSearch && matchesPref;
    } else {
      const matchesCategory =
        categoryFilter === "All" || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    }
  });

  // Sorting Logic
  if (sortBy === "priceLowHigh")
    filteredProducts.sort((a, b) => a.price - b.price);
  else if (sortBy === "priceHighLow")
    filteredProducts.sort((a, b) => b.price - a.price);
  else if (sortBy === "ratingHighLow")
    filteredProducts.sort((a, b) => b.rating - a.rating);
  else if (sortBy === "ratingLowHigh")
    filteredProducts.sort((a, b) => a.rating - b.rating);

  // 2. New Helper Function: Handles Authentication Check before Cart actions
  const handleCartAction = (e, product, quantityChange = 1) => {
    e.stopPropagation(); // Prevent clicking the card (navigation)

    if (!currentUser) {
      // User is NOT logged in
      alert("Please log in to add items to your cart.");
      navigate("/login"); // Redirect to login page
      return;
    }

    // User IS logged in, proceed with action
    // Note: Depending on your addToCart implementation, it might take (product) or (product, quantity)
    // The code below adapts to the usage seen in your original code
    if (quantityChange === 1 && arguments.length === 2) {
      addToCart(product); // Standard add
    } else {
      addToCart(product, quantityChange); // Increment/Decrement
    }
  };

  return (
    <div className="home-page">
      <header className="hero-section">
        <div className="hero-content-wrapper">
          <h1 className="text-gradient">Shop Sphere</h1>
          <p>Premium Quality. Fast Delivery. Secure Payments</p>
          <button
            className="btn-main"
            onClick={() =>
              document
                .getElementById("shop-start")
                .scrollIntoView({ behavior: "smooth" })
            }
          >
            <span>Shop Now</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </header>

      <div className="home-container" id="shop-start">
        {/* Filter & Search Bar */}
        <div className="filter-wrapper">
          <div className="search-box">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search for items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-actions">
            {/* For You Toggle Button */}
            <button
              className={`for-you-btn ${forYouMode ? "active" : ""}`}
              onClick={() => {
                setForYouMode(!forYouMode);
                setCategoryFilter("All");
              }}
            >
              <Sparkles size={16} />
              <span>For You</span>
            </button>

            <div
              className="select-wrapper"
              style={{ opacity: forYouMode ? 0.5 : 1 }}
            >
              <SlidersHorizontal size={16} className="select-icon" />
              <select
                value={categoryFilter}
                disabled={forYouMode}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "All" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="select-wrapper">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="default">Sort By: Featured</option>
                <option value="priceLowHigh">Price: Low to High</option>
                <option value="priceHighLow">Price: High to Low</option>
                <option value="ratingHighLow">Rating: High to Low</option>
                <option value="ratingLowHigh">Rating: Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="product-grid">
          {filteredProducts.map((product) => {
            const cartItem = cart?.find((item) => item.id === product.id);
            const quantity = cartItem ? cartItem.quantity : 0;
            const isOutOfStock = product.stock === 0;

            return (
              <div
                key={product.id}
                className="product-card"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="image-container">
                  <div className="category-ribbon">{product.category}</div>
                  <div
                    className={`stock-ribbon ${
                      isOutOfStock ? "out" : product.stock < 5 ? "low" : ""
                    }`}
                  >
                    {isOutOfStock
                      ? "Out of Stock"
                      : `${product.stock} in Stock`}
                  </div>
                  <img src={product.imageUrl} alt={product.name} />
                </div>

                <div className="card-info">
                  <h3>{product.name}</h3>
                  <div className="rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        fill={star <= product.rating ? "#ffc107" : "none"}
                        color={star <= product.rating ? "#ffc107" : "#e2e8f0"}
                      />
                    ))}
                    <span className="rating-number">{product.rating}</span>
                  </div>
                  <p className="price">₹ {product.price}</p>

                  <div className="card-actions">
                    {quantity > 0 ? (
                      <div
                        className="quantity-controls"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="qty-btn"
                          type="button"
                          // 3. Updated Click Handler: Checks auth before decrementing
                          onClick={(e) => handleCartAction(e, product, -1)}
                        >
                          <Minus size={16} color="#0f172a" strokeWidth={3} />
                        </button>
                        <span className="qty-count">{quantity}</span>
                        <button
                          className="qty-btn"
                          type="button"
                          disabled={quantity >= product.stock}
                          // 4. Updated Click Handler: Checks auth before incrementing
                          onClick={(e) => handleCartAction(e, product, 1)}
                        >
                          <Plus size={16} color="#0f172a" strokeWidth={3} />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="add-cart-btn"
                        disabled={isOutOfStock}
                        // 5. Updated Click Handler: Checks auth before adding new item
                        onClick={(e) => handleCartAction(e, product)}
                        style={{
                          opacity: isOutOfStock ? 0.6 : 1,
                          cursor: isOutOfStock ? "not-allowed" : "pointer",
                        }}
                      >
                        <ShoppingCart
                          size={18}
                          color="white"
                          strokeWidth={2.5}
                        />
                        <span>{isOutOfStock ? "Sold Out" : "Add to Cart"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-5">
            <h3>No products found</h3>
            <p className="text-muted">
              Try adjusting your filters or search term.
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        {paginationEnabled && totalElements > 0 && (
          <div className="d-flex justify-content-between align-items-center mt-4">
            <div>
              <p className="mb-0 text-muted">
                Showing {totalElements === 0 ? 0 : (normalizedPage - 1) * PRODUCTS_PER_PAGE + 1} - {Math.min(normalizedPage * PRODUCTS_PER_PAGE, totalElements)} of {totalElements} products
              </p>
            </div>
            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${normalizedPage === 1 ? 'disabled' : ''}`}>
                  <button
                    type="button"
                    className="page-link"
                    disabled={normalizedPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  >
                    Previous
                  </button>
                </li>

                {(() => {
                  const pages = [];
                  const maxButtons = 7;
                  if (totalPages <= maxButtons) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    const left = Math.max(2, normalizedPage - 1);
                    const right = Math.min(totalPages - 1, normalizedPage + 1);

                    pages.push(1);
                    if (left > 2) pages.push('left-ellipsis');

                    for (let p = left; p <= right; p++) pages.push(p);

                    if (right < totalPages - 1) pages.push('right-ellipsis');
                    pages.push(totalPages);
                  }

                  return pages.map((item, idx) => {
                    if (item === 'left-ellipsis' || item === 'right-ellipsis') {
                      return (
                        <li key={item + idx} className="page-item disabled">
                          <span className="page-link">&hellip;</span>
                        </li>
                      );
                    }

                    const page = item;
                    return (
                      <li key={page} className={`page-item ${normalizedPage === page ? 'active' : ''}`}>
                        <button
                          type="button"
                          className="page-link"
                          disabled={normalizedPage === page}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </li>
                    );
                  });
                })()}

                <li className={`page-item ${normalizedPage === totalPages ? 'disabled' : ''}`}>
                  <button
                    type="button"
                    className="page-link"
                    disabled={normalizedPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Home;
