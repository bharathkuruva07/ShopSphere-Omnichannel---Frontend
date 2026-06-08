import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import {
  Trash2,
  ArrowLeft,
  CheckCircle,
  Truck,
  Store,
  MapPin,
  Plus,
  Minus,
} from "lucide-react"; // Added Plus/Minus
import "./Cart.css";

// Define image URLs for payment logos to be used in the UI later.
const gpayIcon =
  "https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg";
const phonepeIcon =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/PhonePe_Logo.svg/1200px-PhonePe_Logo.svg.png";
const paytmIcon =
  "https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg";
const bhimIcon =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png";

// --- SUB-COMPONENTS (Kept your original detailed components) ---

const DeliveryModeSelector = ({ mode, setMode }) => (
  <div className="cart-card fade-in">
    <h3 className="card-title">Select Delivery Mode</h3>
    <div className="mode-grid">
      <div
        className={`mode-card ${mode === "online" ? "selected" : ""}`}
        onClick={() => setMode("online")}
      >
        <div className="mode-icon">
          <Truck size={24} />
        </div>
        <div className="mode-info">
          <span className="mode-title">Online Delivery</span>
          <span className="mode-desc">Delivered to your doorstep</span>
        </div>
        <div className="radio-circle"></div>
      </div>
      <div
        className={`mode-card ${mode === "store" ? "selected" : ""}`}
        onClick={() => setMode("store")}
      >
        <div className="mode-icon">
          <Store size={24} />
        </div>
        <div className="mode-info">
          <span className="mode-title">Visit Store</span>
          <span className="mode-desc">Pick up from nearby shop</span>
        </div>
        <div className="radio-circle"></div>
      </div>
    </div>
  </div>
);

const StorePickupSelector = ({
  selectedStore,
  setSelectedStore,
  stores = [],
}) => (
  <div className="cart-card fade-in">
    <h3 className="card-title">Select Store for Pickup</h3>
    <div className="store-list">
      {stores.map((store) => (
        <div
          key={store.id}
          className={`store-item ${selectedStore === store.id ? "active" : ""}`}
          onClick={() => setSelectedStore(store.id)}
        >
          <div className="store-icon">
            <MapPin size={20} />
          </div>
          <div className="store-details">
            <span className="store-name">{store.name}</span>
            <span className="store-address">{store.address}</span>
            <span className="store-distance">{store.city} </span>
          </div>
          <div className="radio-circle-small"></div>
        </div>
      ))}
    </div>
  </div>
);

const AddressForm = ({ address, setAddress }) => (
  <div className="cart-card fade-in">
    <h3 className="card-title">Shipping Address</h3>
    <div className="form-grid">
      <input
        className="form-input"
        placeholder="Full Name"
        value={address.name}
        onChange={(e) => setAddress({ ...address, name: e.target.value })}
      />
      <input
        className="form-input"
        placeholder="Address Line 1"
        value={address.line1}
        onChange={(e) => setAddress({ ...address, line1: e.target.value })}
      />
      <div className="form-row">
        <input
          className="form-input"
          placeholder="City"
          value={address.city}
          onChange={(e) => setAddress({ ...address, city: e.target.value })}
        />
        <input
          className="form-input"
          placeholder="State"
          value={address.state}
          onChange={(e) => setAddress({ ...address, state: e.target.value })}
        />
      </div>
      <input
        className="form-input"
        placeholder="PIN Code"
        value={address.pincode}
        onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
      />
    </div>
  </div>
);

const CardPaymentForm = ({ payment, setPayment, errors, setErrors }) => {
  // Helper function to format card number with spaces every 4 digits
  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, "").slice(0, 16);
    const groups = cleaned.match(/.{1,4}/g) || [];
    return groups.join(" ");
  };

  // Helper function to format expiry date as MM/YY
  const formatExpiry = (value) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  // Helper function to validate card number (16 digits)
  const validateCardNumber = (cardNumber) => {
    const cleaned = cardNumber.replace(/\s/g, "");
    if (cleaned.length !== 16) {
      return "Card number must be 16 digits";
    }
    if (!/^\d+$/.test(cleaned)) {
      return "Card number must contain only digits";
    }
    return "";
  };

  // Helper function to validate expiry date (future dates only)
  const validateExpiry = (expiryDate) => {
    if (!expiryDate || expiryDate.length !== 5) {
      return "Expiry date must be MM/YY format";
    }
    const [month, year] = expiryDate.split("/");
    const monthNum = parseInt(month, 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return "Expiry month must be between 01 and 12";
    }
    
    // Get current year and month
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Get last 2 digits
    const currentMonth = currentDate.getMonth() + 1;
    
    // Convert input year to 2-digit number
    const yearNum = parseInt(year, 10);
    
    // Check if year is in the past
    if (yearNum < currentYear) {
      return "Card has expired";
    }
    
    // Check if year is current and month is in the past
    if (yearNum === currentYear && monthNum < currentMonth) {
      return "Card has expired";
    }
    
    // Check if year is too far in the future (more than 30 years)
    if (yearNum > currentYear + 30) {
      return "Expiry year is too far in the future";
    }
    
    return "";
  };

  // Helper function to validate CVV
  const validateCVV = (cvv) => {
    if (!cvv || cvv.length !== 3) {
      return "CVV must be exactly 3 digits";
    }
    if (!/^\d+$/.test(cvv)) {
      return "CVV must contain only digits";
    }
    return "";
  };

  // Handle card number input
  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setPayment({ ...payment, cardNumber: formatted });
    
    // Validate on change
    if (formatted.length === 19) {
      // 16 digits + 3 spaces
      const error = validateCardNumber(formatted);
      setErrors({ ...errors, cardNumber: error });
    } else if (errors.cardNumber) {
      setErrors({ ...errors, cardNumber: "" });
    }
  };

  // Handle expiry input
  const handleExpiryChange = (e) => {
    const formatted = formatExpiry(e.target.value);
    setPayment({ ...payment, expiry: formatted });
    
    // Validate on change
    if (formatted.length === 5) {
      const error = validateExpiry(formatted);
      setErrors({ ...errors, expiry: error });
    } else if (errors.expiry) {
      setErrors({ ...errors, expiry: "" });
    }
  };

  // Handle CVV input
  const handleCVVChange = (e) => {
    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 3);
    setPayment({ ...payment, cvv: cleaned });
    
    // Validate on change
    if (cleaned.length === 3) {
      const error = validateCVV(cleaned);
      setErrors({ ...errors, cvv: error });
    } else if (errors.cvv) {
      setErrors({ ...errors, cvv: "" });
    }
  };

  return (
    <div className="cart-card fade-in" style={{ animationDelay: "0.1s" }}>
      <h3 className="card-title">Payment Method</h3>
      <div className="payment-options">
        {["card", "upi", "COD"].map((method) => (
          <button
            key={method}
            type="button"
            className={`payment-btn ${payment.method === method ? "active" : ""}`}
            onClick={() => setPayment({ ...payment, method: method })}
          >
            {method.toUpperCase()}
          </button>
        ))}
      </div>
      {payment.method === "card" && (
        <div className="card-details slide-down">
          <div className="form-group">
            <input
              className={`form-input ${errors.nameOnCard ? "input-error" : ""}`}
              placeholder="Name on Card"
              value={payment.nameOnCard}
              onChange={(e) => {
                setPayment({ ...payment, nameOnCard: e.target.value });
                if (e.target.value) {
                  setErrors({ ...errors, nameOnCard: "" });
                }
              }}
            />
            {errors.nameOnCard && (
              <span className="error-text">{errors.nameOnCard}</span>
            )}
          </div>

          <div className="form-group">
            <input
              className={`form-input ${errors.cardNumber ? "input-error" : ""}`}
              placeholder="Card Number (16 digits)"
              maxLength="19"
              value={payment.cardNumber}
              onChange={handleCardNumberChange}
            />
            {errors.cardNumber && (
              <span className="error-text">{errors.cardNumber}</span>
            )}
            {!errors.cardNumber && payment.cardNumber.length === 19 && (
              <span className="success-text">✓ Valid card number</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                className={`form-input ${errors.expiry ? "input-error" : ""}`}
                placeholder="MM/YY"
                maxLength="5"
                value={payment.expiry}
                onChange={handleExpiryChange}
              />
              {errors.expiry && (
                <span className="error-text">{errors.expiry}</span>
              )}
              {!errors.expiry && payment.expiry.length === 5 && (
                <span className="success-text">✓ Valid expiry</span>
              )}
            </div>

            <div className="form-group">
              <input
                className={`form-input ${errors.cvv ? "input-error" : ""}`}
                placeholder="CVV (3 digits)"
                maxLength="3"
                type="password"
                value={payment.cvv}
                onChange={handleCVVChange}
              />
              {errors.cvv && <span className="error-text">{errors.cvv}</span>}
              {!errors.cvv && payment.cvv.length === 3 && (
                <span className="success-text">✓ Valid CVV</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PaymentForm = ({ payment, setPayment, errors = {}, setErrors = () => {} }) => {
  if (payment.method === "card") {
    return (
      <CardPaymentForm
        payment={payment}
        setPayment={setPayment}
        errors={errors}
        setErrors={setErrors}
      />
    );
  }

  return (
    <div className="cart-card fade-in" style={{ animationDelay: "0.1s" }}>
      <h3 className="card-title">Payment Method</h3>
      <div className="payment-options">
        {["card", "upi", "COD"].map((method) => (
          <button
            key={method}
            type="button"
            className={`payment-btn ${payment.method === method ? "active" : ""}`}
            onClick={() => setPayment({ ...payment, method: method })}
          >
            {method.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export default function Cart() {
  const navigate = useNavigate();
  // Added helper functions from Friend's code (addToCart, updateCartQuantity)
  const {
    cart,
    removeFromCart,
    currentUser,
    addToCart,
    updateCartQuantity,
    loyaltyPoints,
    clearCart,
    stores: contextStores,
    fetchStores: fetchStoresFromContext,
    createBackendOrder,
    refreshUserData,
  } = useApp();

  // State Declarations
  const [deliveryMethod, setDeliveryMethod] = useState("online");
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState(
    currentUser.loyaltyPoints,
  );
  const [nearbyStores, setNearbyStores] = useState([]);

  const [address, setAddress] = useState({
    name: currentUser?.name || "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [payment, setPayment] = useState({
    method: "COD",
    nameOnCard: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  const [paymentErrors, setPaymentErrors] = useState({
    nameOnCard: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  const [status, setStatus] = useState(null);
  const [showUpiSelector, setShowUpiSelector] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [totals, setTotals] = useState({ subtotal: 0, tax: 0, total: 0 });

  const UPI_APPS = [
    { id: "gpay", name: "Google Pay", icon: gpayIcon },
    { id: "phonepe", name: "PhonePe", icon: phonepeIcon },
    { id: "paytm", name: "Paytm", icon: paytmIcon },
    { id: "bhim", name: "BHIM", icon: bhimIcon },
  ];

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(val);

  // --- EFFECT: FETCH NEARBY STORES ---
  useEffect(() => {
    fetchStoresFromContext({ pageNumber: 0, pageSize: 50 }).catch((err) =>
      console.error("Failed to fetch stores:", err),
    );
  }, [fetchStoresFromContext]);

  // Sync stores from context
  useEffect(() => {
    setNearbyStores(contextStores || []);
  }, [contextStores]);

  // --- EFFECT: CALCULATE TOTALS (Friend's Logic) ---
  useEffect(() => {
    const sub = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = sub * 0.1;

    // Improved Shipping Logic: Only charge shipping if Online Mode AND subtotal < 500
    let shipping = 0;
    if (deliveryMethod === "online") {
      shipping = sub > 500 ? 0 : 50;
    }

    // Calculate loyalty points discount (100 points = 1 rupee)
    let loyaltyDiscount = 0;
    if (useLoyaltyPoints && loyaltyPointsToRedeem > 0) {
      loyaltyDiscount = loyaltyPointsToRedeem / 100;
    }

    const subtotalWithTaxAndShipping = sub + tax + shipping;
    const finalTotal = Math.max(
      0,
      subtotalWithTaxAndShipping - loyaltyDiscount,
    );

    setTotals({
      subtotal: sub,
      tax,
      shipping,
      loyaltyDiscount,
      total: finalTotal,
      subtotalBeforeDiscount: subtotalWithTaxAndShipping,
    });
  }, [cart, deliveryMethod, useLoyaltyPoints, loyaltyPointsToRedeem]);

  const handleConfirmPayment = () => {
    if (deliveryMethod === "online") {
      if (!address.name || !address.line1 || !address.pincode) {
        setStatus({
          type: "error",
          text: "Please fill in the shipping address.",
        });
        return;
      }
    } else {
      if (!selectedStoreId) {
        setStatus({ type: "error", text: "Please select a store for pickup." });
        return;
      }
    }

    // Validate card payment if card method is selected
    if (payment.method === "card") {
      const errors = {};
      const cleaned = payment.cardNumber.replace(/\s/g, "");
      
      if (!payment.nameOnCard.trim()) {
        errors.nameOnCard = "Name on card is required";
      }
      
      if (cleaned.length !== 16) {
        errors.cardNumber = "Card number must be 16 digits";
      } else if (!/^\d+$/.test(cleaned)) {
        errors.cardNumber = "Card number must contain only digits";
      }
      
      if (!payment.expiry || payment.expiry.length !== 5) {
        errors.expiry = "Expiry date must be MM/YY format";
      } else {
        const [month, year] = payment.expiry.split("/");
        const monthNum = parseInt(month, 10);
        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
          errors.expiry = "Expiry month must be between 01 and 12";
        } else {
          // Validate future date
          const currentDate = new Date();
          const currentYear = currentDate.getFullYear() % 100;
          const currentMonth = currentDate.getMonth() + 1;
          const yearNum = parseInt(year, 10);
          
          if (yearNum < currentYear) {
            errors.expiry = "Card has expired";
          } else if (yearNum === currentYear && monthNum < currentMonth) {
            errors.expiry = "Card has expired";
          } else if (yearNum > currentYear + 30) {
            errors.expiry = "Expiry year is too far in the future";
          }
        }
      }
      
      if (!payment.cvv || payment.cvv.length !== 3) {
        errors.cvv = "CVV must be exactly 3 digits";
      } else if (!/^\d+$/.test(payment.cvv)) {
        errors.cvv = "CVV must contain only digits";
      }
      
      if (Object.keys(errors).length > 0) {
        setPaymentErrors(errors);
        setStatus({
          type: "error",
          text: "Please correct the card payment details.",
        });
        return;
      }
      
      setPaymentErrors({});
    }

    if (payment.method === "upi") {
      setShowUpiSelector(true);
      return;
    }

    processOrder();
  };

  const processOrder = async (viaApp = null) => {
    const msg = viaApp ? `Processing via ${viaApp}...` : "Processing ...";
    setStatus({ type: "loading", text: msg });
    setShowUpiSelector(false);

    try {
      // Prepare order data for backend
      const selectedStore =
        deliveryMethod === "store"
          ? nearbyStores.find((s) => s.id === selectedStoreId)
          : null;

      const shippingAddressData =
        deliveryMethod === "online"
          ? {
              name: address.name,
              line1: address.line1,
              city: address.city,
              state: address.state,
              pincode: address.pincode,
            }
          : {
              id: selectedStore?.id,
              name: selectedStore?.name,
              address: selectedStore?.address,
              distance: selectedStore?.distance,
            };

      const orderItems = cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        description: item.description,
        category: item.category,
        stock: item.stock,
        rating: item.rating,
        quantity: item.quantity,
      }));

      const orderPayload = {
        items: orderItems,
        shippingAddress: shippingAddressData,
        paymentMethod: payment.method.toUpperCase(),
        storeId: deliveryMethod === "store" ? selectedStore?.id : null,
        loyaltyPointsToUse: useLoyaltyPoints ? loyaltyPointsToRedeem : 0,
      };

      // Send order to backend
      const response = await createBackendOrder(orderPayload, currentUser.id);

      if (response.data) {
        // Backend handles order creation and loyalty points update
        // Just clear the cart and refresh user data for updated loyalty points
        clearCart();
        
        // Refresh user data to get updated loyalty points from backend
        if (refreshUserData) {
          try {
            await refreshUserData();
          } catch (err) {
            console.warn("Failed to refresh user data:", err);
          }
        }

        setStatus(null);
        setOrderSuccess(true);
      }
    } catch (error) {
      console.error("Failed to create order:", error);
      setStatus({
        type: "error",
        text: "Failed to place order. Please try again.",
      });
    }
  };

  const SafeImage = ({ src, alt, fallbackText }) => {
    const [hasError, setHasError] = useState(false);
    if (hasError) return <div className="icon-fallback">{fallbackText}</div>;
    return <img src={src} alt={alt} onError={() => setHasError(true)} />;
  };

  // --- RENDER SUCCESS ---
  if (orderSuccess) {
    return (
      <div className="cart-container success-view">
        <div className="success-card fade-in">
          <div className="success-icon-container">
            <CheckCircle size={64} color="#10b981" />
          </div>
          <h2>
            {payment.method === "COD" ? "Order Placed!" : "Payment Confirmed!"}
          </h2>
          <p>
            {deliveryMethod === "store"
              ? "Your order is ready. Please visit the selected store for pickup."
              : "Your order has been placed and will be delivered soon."}
          </p>
          <button className="primary-btn" onClick={() => navigate("/")}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER MAIN ---
  return (
    <div className="cart-container">
      <header className="cart-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1>Checkout</h1>
      </header>

      <div className="cart-layout">
        <div className="cart-main">
          {/* 1. Component from your code */}
          <DeliveryModeSelector
            mode={deliveryMethod}
            setMode={setDeliveryMethod}
          />

          {/* 2. Component from your code */}
          {deliveryMethod === "online" ? (
            <AddressForm address={address} setAddress={setAddress} />
          ) : (
            <StorePickupSelector
              selectedStore={selectedStoreId}
              setSelectedStore={setSelectedStoreId}
              stores={nearbyStores}
            />
          )}

          {/* 3. Component from your code */}
          <PaymentForm 
            payment={payment} 
            setPayment={setPayment}
            errors={paymentErrors}
            setErrors={setPaymentErrors}
          />
        </div>

        {/* SIDEBAR: UPDATED WITH FRIEND'S FUNCTIONALITY */}
        <aside className="cart-sidebar">
          <div className="cart-card summary-card sticky">
            <h3 className="card-title">Order Summary</h3>

            {cart.length === 0 ? (
              <div className="empty-state">
                <p>Your cart is empty.</p>
                <button className="text-btn" onClick={() => navigate("/")}>
                  Shop Now
                </button>
              </div>
            ) : (
              <div className="order-items">
                {cart.map((item) => (
                  <div key={item.id} className="summary-item">
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>

                      {/* --- NEW FUNCTIONALITY: QUANTITY CONTROLS --- */}
                      <div
                        className="quantity-controls"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="qty-btn"
                          onClick={() =>
                            item.quantity - 1 <= 0
                              ? removeFromCart(item.id)
                              : updateCartQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Minus size={16} />
                        </button>
                        <span className="qty-count">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          disabled={item.quantity >= (item.stock || 99)}
                          onClick={() => addToCart(item)}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      {/* ------------------------------------------- */}
                    </div>
                    <div className="item-actions">
                      <span className="item-price">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                      <button
                        className="btn-icon-danger"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="divider"></div>

            {/* LOYALTY POINTS SECTION */}
            <div className="loyalty-points-container pb-0">
              <div className="loyalty-header">
                <h4 className="loyalty-title">Use Loyalty Points</h4>
                <span className="loyalty-balance">
                  {loyaltyPoints || 0} pts
                </span>
              </div>

              <div className="loyalty-checkbox-wrapper">
                <label className="loyalty-checkbox-label">
                  <input
                    type="checkbox"
                    checked={useLoyaltyPoints}
                    onChange={(e) => {
                      setUseLoyaltyPoints(e.target.checked);
                      if (!e.target.checked) {
                        setLoyaltyPointsToRedeem(0);
                      }
                    }}
                    className="loyalty-checkbox"
                  />
                  <span>Use Loyalty Points for this purchase</span>
                </label>
              </div>

              {useLoyaltyPoints && (
                <div className="loyalty-redeem-section">
                  <label className="redeem-label">
                    Redeem Points (100 points = ₹1)
                  </label>
                  <div className="redeem-input-wrapper">
                    <input
                      type="text"
                      min="0"
                      max={loyaltyPoints || 0}
                      value={loyaltyPointsToRedeem}
                      onChange={(e) => {
                        const value = Math.min(
                          Math.max(0, parseInt(e.target.value) || 0),
                          loyaltyPoints  || 0,
                        );
                        setLoyaltyPointsToRedeem(value);
                      }}
                      className="redeem-input"
                      placeholder="0"
                    />
                    <span className="redeem-currency">pts</span>
                  </div>

                  <div className="loyalty-info">
                    <p className="info-available">
                      Available: {loyaltyPoints || 0} points | Max redeemable:{" "}
                      {loyaltyPoints || 0} points
                    </p>
                    {loyaltyPointsToRedeem > loyaltyPoints && (
                      <p className="info-error">
                        Cannot redeem more than {loyaltyPoints || 0} points
                        available
                      </p>
                    )}
                  </div>

                  <div className="loyalty-earned">
                    <span className="earned-text">
                      Earn{" "}
                      <span className="text-success fs-6 fw-bold">
                        {Math.floor(totals.subtotal / 100) * 10}
                      </span>{" "}
                      points on this purchase
                    </span>
                  </div>
                </div>
              )}

              {!useLoyaltyPoints && (
                <div className="loyalty-earned">
                  <span className="earned-text text-center">
                    Earn{" "}
                    <span className="text-success fs-6 fw-bold">
                      {Math.floor(totals.subtotal / 100) * 10}
                    </span>{" "}
                    points on this purchase
                  </span>
                </div>
              )}
            </div>

            <div className="divider"></div>
            <div className="totals">
              <div className="row">
                <span>Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="row">
                <span>Tax (10%)</span>
                <span>{formatCurrency(totals.tax)}</span>
              </div>
              <div className="row">
                <span>
                  Shipping ({deliveryMethod === "store" ? "Pickup" : "Delivery"}
                  )
                </span>
                <span className={totals.shipping === 0 ? "text-success" : ""}>
                  {totals.shipping === 0
                    ? "Free"
                    : formatCurrency(totals.shipping)}
                </span>
              </div>
              {totals.loyaltyDiscount > 0 && (
                <div className="row loyalty-discount">
                  <span>Loyalty Points Discount</span>
                  <span className="text-success">
                    -{formatCurrency(totals.loyaltyDiscount)}
                  </span>
                </div>
              )}
              <div className="row total">
                <span>Total</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>

            <button
              className="primary-btn checkout-btn"
              onClick={handleConfirmPayment}
              disabled={cart.length === 0}
            >
              {payment.method === "COD" ? "Place Order" : "Confirm Payment"}
            </button>

            {status && (
              <div className={`status-badge ${status.type}`}>{status.text}</div>
            )}
          </div>
        </aside>
      </div>

      {showUpiSelector && (
        <div
          className="modal-backdrop"
          onClick={() => setShowUpiSelector(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Select UPI App</h3>
            <div className="upi-grid">
              {UPI_APPS.map((app) => (
                <button
                  key={app.id}
                  className="upi-item"
                  onClick={() => processOrder(app.name)}
                >
                  <SafeImage
                    src={app.icon}
                    alt={app.name}
                    fallbackText={app.name[0]}
                  />
                  <span>{app.name}</span>
                </button>
              ))}
            </div>
            <button
              className="text-btn"
              onClick={() => setShowUpiSelector(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
