import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { productAPI } from "../../services/productAPI.JS";
import {
  Star,
  ShoppingCart,
  ChevronLeft,
  Truck,
  ShieldCheck,
  RotateCcw,
  Plus,
  Minus,
} from "lucide-react";
import "./ProductDetail.css";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cart, addToCart, currentUser } = useApp();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        // Fetch single product from backend
        // productAPI.getProductById returns response.data which is: {success, message, data: {...}, timestamp}
        const response = await productAPI.getProductById(id);
        
        console.log("Product API response:", response);
        
        // Extract actual product data from wrapped response
        const productData = response.data || response;
        
        console.log("Product data extracted:", productData);
        
        // Ensure productData is valid before setting state
        if (productData && productData.id) {
          setProduct(productData);

          // Fetch related products by category
          if (productData.category) {
            try {
              const relatedResponse = await productAPI.getProductsByCategory(productData.category, 0, 4);
              
              console.log("Related API response:", relatedResponse);
              
              // relatedResponse is: {success, message, data: {content: [...]}, timestamp}
              // Extract the content array from the data property
              let relatedContent = [];
              const responseData = relatedResponse.data || relatedResponse;
              
              if (Array.isArray(responseData)) {
                // Direct array
                relatedContent = responseData;
              } else if (responseData && Array.isArray(responseData.content)) {
                // Object with content property (paginated response)
                relatedContent = responseData.content;
              } else if (responseData && Array.isArray(responseData.data)) {
                // Nested data array
                relatedContent = responseData.data;
              }
              
              console.log("Related products content:", relatedContent);
              
              const filtered = relatedContent
                .filter((p) => String(p.id) !== String(id))
                .slice(0, 3);
              
              console.log("Related products filtered:", filtered);
              setRelatedProducts(filtered);
            } catch (err) {
              console.error("Error fetching related products:", err);
              setRelatedProducts([]);
            }
          }

          window.scrollTo(0, 0);
        } else {
          console.error("Invalid product data:", productData);
          setProduct(null);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductData();
    }
  }, [id]);

  if (loading) return <div className="error-page">Loading product...</div>;
  if (!product) return <div className="error-page">Product not found</div>;

  const cartItem = cart?.find((item) => String(item.id) === String(product.id));
  const currentQty = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.stock === 0;

  return (
    <div className="product-detail-page py-5">
      <div className="container">
        <button className="back-btn mb-4" onClick={() => navigate("/")}>
          <ChevronLeft size={18} /> Back to Shop
        </button>

        <div className="row g-5">
          <div className="col-lg-5">
            <div className="detail-image-box shadow-sm mb-4">
              <img
                src={product.imageUrl || product.image_url || product.image || 'https://via.placeholder.com/400'}
                alt={product.name}
                className="img-fluid rounded-4"
              />
            </div>

            <div className="highlight-grid">
              <div className="highlight-item">
                <Truck className="text-indigo mb-2" size={24} />
                <p className="small fw-bold mb-0">FREE SHIPPING</p>
              </div>
              <div className="highlight-item">
                <RotateCcw className="text-indigo mb-2" size={24} />
                <p className="small fw-bold mb-0">30 DAY RETURN</p>
              </div>
              <div className="highlight-item">
                <ShieldCheck className="text-indigo mb-2" size={24} />
                <p className="small fw-bold mb-0">TRUSTED BRAND</p>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="info-section">
              <div className="mb-2">
                <span className="badge-tag me-2">{product.category}</span>
                <span
                  className={`badge ${
                    !isOutOfStock ? "bg-success" : "bg-danger"
                  }`}
                >
                  {!isOutOfStock ? "In Stock" : "Out of Stock"}
                </span>
              </div>

              <h1 className="display-5 fw-bold">{product.name}</h1>

              <div className="rating-row">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    fill={i < Math.floor(product.rating) ? "#ffc107" : "none"}
                    color="#ffc107"
                  />
                ))}
                <span className="rating-text ms-2">
                  {product.rating} (Reviews)
                </span>
              </div>

              <div className="price-tag my-3">
                <h2 className="current-price mb-0">₹{product.price}</h2>
                <span className="old-price text-muted">
                  ₹{(product.price * 1.2).toFixed(0)}
                </span>
              </div>

              <p className="detail-desc text-secondary">
                {product.description || product.desc}
              </p>

              <div className="detail-actions mt-4">
                {currentQty > 0 ? (
                  <div className="qty-selector-container">
                    <button
                      className="qty-btn"
                      onClick={() => addToCart(product, -1)}
                    >
                      <Minus size={20} />
                    </button>
                    <span className="qty-count px-4 fw-bold">{currentQty}</span>
                    <button
                      className="qty-btn"
                      disabled={currentQty >= product.stock}
                      onClick={() => addToCart(product, 1)}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn-cart"
                    disabled={isOutOfStock}
                    onClick={() => {
                      if (!currentUser) {
                        alert("Please log in to shop");
                        navigate("/login");
                        return;
                      } else {
                        addToCart(product);
                      }
                    }}
                    style={{
                      backgroundColor: isOutOfStock ? "#939dabff" : "",
                      cursor: isOutOfStock ? "not-allowed" : "pointer",
                    }}
                  >
                    <ShoppingCart size={20} className="me-2" />
                    {isOutOfStock ? "Sold Out" : "Add to Cart"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="related-section mt-5 pt-5 border-top">
            <h3 className="fw-bold mb-4">Related Products</h3>
            <div className="product-grid">
              {relatedProducts.map((item) => {
                const itemInCart = cart?.find(
                  (c) => String(c.id) === String(item.id)
                );
                const itemQty = itemInCart ? itemInCart.quantity : 0;
                const relatedOutOfStock = item.stock === 0;

                return (
                  <div
                    key={item.id}
                    className="product-card"
                    onClick={() => navigate(`/product/${item.id}`)}
                  >
                    <div className="image-container">
                      <img src={item.imageUrl || item.image_url || item.image || 'https://via.placeholder.com/200'} alt={item.name} />
                    </div>
                    <div className="card-info">
                      <h3>{item.name}</h3>
                      <p className="price">₹ {item.price}</p>
                      <div className="card-actions">
                        {itemQty > 0 ? (
                          <div
                            className="quantity-controls"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="qty-btn"
                              type="button"
                              onClick={() => addToCart(item, -1)}
                            >
                              <Minus
                                size={16}
                                color="#0f172a"
                                strokeWidth={3}
                              />
                            </button>
                            <span className="qty-count">{itemQty}</span>
                            <button
                              className="qty-btn"
                              type="button"
                              disabled={itemQty >= item.stock}
                              onClick={() => addToCart(item, 1)}
                            >
                              <Plus size={16} color="#0f172a" strokeWidth={3} />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="add-cart-btn"
                            disabled={relatedOutOfStock}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!currentUser) {
                                alert("Please log in to shop");
                                navigate("/login");
                                return;
                              }
                              addToCart(item);
                            }}
                            style={{
                              backgroundColor: relatedOutOfStock ? "#939dabff" : "",
                              cursor: relatedOutOfStock ? "not-allowed" : "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                            }}
                          >
                            <ShoppingCart size={18} />
                            <span>
                              {relatedOutOfStock ? "Sold Out" : "Add to Cart"}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default ProductDetail;
