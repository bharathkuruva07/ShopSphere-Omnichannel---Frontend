import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import OrderTracking from "../OrderTracking/OrderTracking";
import {
  Gift,
  ShoppingBag,
  IndianRupee,
  Settings,
  TrendingUp,
  CheckCircle,
  Store,
} from "lucide-react";
import "./Profile.css";

// Helper function to detect store pickup orders
const isStorePickup = (order) => {
  if (order?.storeId != null) return true;
  // Fallback: check if shipping address contains store indicators
  const addr = order?.shippingAddress;
  if (addr?.name?.toLowerCase().includes("store")) return true;
  if (addr?.address?.toLowerCase().includes("store pickup")) return true;
  return false;
};

// Pickup-specific status labels
const PICKUP_STATUS_LABELS = {
  pending: "Order Received",
  packing: "Packing",
  processing: "Packing",
  confirmed: "Packed & Ready",
  delivered: "Picked Up",
  cancelled: "Cancelled",
};

// Format order ID to display format (e.g., ORD-00023)
const formatOrderId = (id) => {
  const numId = typeof id === "string" ? parseInt(id, 10) : id;
  return `ORD-${String(numId).padStart(5, "0")}`;
};

function Profile() {
  const navigate = useNavigate();

  //from use app
  const { currentUser, refreshUserData, fetchMyOrders } =
    useApp();
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [backendOrders, setBackendOrders] = useState([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(
    currentUser?.loyaltyPoints || 0,
  );

  const defaultPreferences = [
    { id: 1, category: "Electronics", interested: true },
    { id: 2, category: "Accessories", interested: true },
    { id: 3, category: "Fashion", interested: false },
    { id: 4, category: "Home & Living", interested: false },
  ];

  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem("userPreferences");
    return saved ? JSON.parse(saved) : defaultPreferences;
  });

  // Fetch user's orders from backend
  useEffect(() => {
    if (currentUser?.id) {
      // Refresh user data to get latest loyalty points
      const refreshData = async () => {
        const updatedUser = await refreshUserData();
        if (updatedUser?.loyaltyPoints !== undefined) {
          setLoyaltyPoints(updatedUser.loyaltyPoints);
        }
      };
      refreshData();

      const fetchUserOrders = async () => {
        try {
          const ordersList = await fetchMyOrders(currentUser.id, {
            page: 0,
            size: 100,
            sortBy: "createdAt",
            sortDir: "desc",
          });
          setBackendOrders(ordersList);
        } catch (error) {
          console.error("Failed to fetch user orders:", error);
        }
      };
      fetchUserOrders();
    }
  }, [currentUser?.id, refreshUserData]);

  useEffect(() => {
    localStorage.setItem("userPreferences", JSON.stringify(preferences));
  }, [preferences]);

  // Sync loyalty points when currentUser updates
  useEffect(() => {
    if (currentUser?.loyaltyPoints !== undefined) {
      setLoyaltyPoints(currentUser.loyaltyPoints);
    }
  }, [currentUser?.loyaltyPoints]);

  if (!currentUser) {
    return (
      <div className="container py-5 text-center">
        <h2 className="mb-3">Please login to view profile</h2>
        <button className="btn btn-primary" onClick={() => navigate("/login")}>
          Go to Login
        </button>
      </div>
    );
  }

  const userOrders = useMemo(() => {
    if (!currentUser) return [];
    // Use only backend orders - they are the source of truth
    // Local orders were causing duplicates since backend already stores all orders
    return backendOrders;
  }, [backendOrders, currentUser]);
  
  // Calculate total spent only from completed orders (delivered or picked up)
  const totalSpent = useMemo(() => {
    return userOrders
      .filter((order) => {
        const status = order.status?.toLowerCase() || "";
        const tracking = order.trackingStatus?.toLowerCase() || "";
        // Only count delivered orders or orders with "picked up" tracking status
        return status === "delivered" || tracking === "picked up";
      })
      .reduce((sum, order) => {
        // Safely handle order.total which may be undefined or a BigDecimal from backend
        const orderTotal = typeof order.total === 'number' ? order.total : parseFloat(order.total) || 0;
        const tax = orderTotal * 0.1;
        return sum + orderTotal + tax;
      }, 0);
  }, [userOrders]);

  const currentPoints = loyaltyPoints;
  const nextMilestone = Math.ceil((currentPoints + 1) / 500) * 1000;
  const progressPercentage = (currentPoints / nextMilestone) * 100;

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
    document.body.style.overflow = "hidden";
  };

  const closeOrderDetails = () => {
    setShowModal(false);
    document.body.style.overflow = "auto";
  };

  const togglePreference = (id) => {
    setPreferences(
      preferences.map((pref) =>
        pref.id === id ? { ...pref, interested: !pref.interested } : pref,
      ),
    );
  };

  return (
    <div className="profile-page py-5 bg-light">
      <div className="container">
        {/* User Header */}
        <div className="card shadow-sm border-0 mb-4 user-header-card">
          <div className="card-body p-4">
            <div className="row align-items-center">
              <div className="col-md-8">
                <div className="d-flex align-items-center">
                  <div
                    className="avatar-circle bg-primary text-white d-flex align-items-center justify-content-center me-4"
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      fontSize: "32px",
                      fontWeight: "bold",
                    }}
                  >
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="fw-bold mb-1">{currentUser.name}</h2>
                    <p className="text-secondary mb-0">{currentUser.email}</p>
                    <p className="text-secondary mb-0">
                      {currentUser.mobileNumber}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card stat-card shadow-sm border-0 text-center">
              <div className="card-body p-4">
                <ShoppingBag
                  className="text-primary mb-3 mx-auto d-block"
                  size={32}
                />
                <h4 className="fw-bold">{userOrders.length}</h4>
                <p className="text-secondary mb-0">Total Orders</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card stat-card shadow-sm border-0 text-center">
              <div className="card-body p-3">
                <IndianRupee
                  className="text-success mb-3 mx-auto d-block"
                  size={32}
                />
                <h4 className="fw-bold">₹ {totalSpent.toFixed(2)}</h4>
                <p className="text-secondary mb-0">Total Spent on our platform<br />Including Taxes and Shipping</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card stat-card shadow-sm border-0 text-center">
              <div className="card-body p-4">
                <Gift className="text-warning mb-3 mx-auto d-block" size={32} />
                <h4 className="fw-bold">{currentPoints}</h4>
                <p className="text-secondary mb-0">Loyalty Points</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loyalty Points Detailed Card */}
        <div className="card shadow-sm border-0 mb-4 loyalty-card">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <Gift size={24} className="text-warning" />
              Loyalty Program
            </h5>
            <div className="row">
              <div className="col-md-8">
                <p className="text-secondary mb-2">
                  Total Points Balance:{" "}
                  <strong className="text-primary h5">
                    {currentPoints} pts
                  </strong>
                </p>

                <div className="progress mb-2" style={{ height: "12px" }}>
                  <div
                    className="progress-bar bg-warning progress-bar-striped"
                    role="progressbar"
                    style={{ width: `${progressPercentage}%` }}
                    aria-valuenow={currentPoints}
                    aria-valuemin="0"
                    aria-valuemax={nextMilestone}
                  />
                </div>

                <div className="d-flex justify-content-between text-muted small">
                  <span>{currentPoints} pts</span>
                  <span>
                    <TrendingUp size={14} className="me-1" />
                    Next Tier: {nextMilestone}
                  </span>
                </div>

                <div className="alert alert-light border mt-3 mb-0 py-2 d-flex align-items-center">
                  <small className="text-muted">
                    💡 <strong>Tip:</strong> You earn 10 Points for every ₹100
                    spent on purchases.
                  </small>
                </div>
              </div>

              <div className="col-md-4 text-md-end mt-3 mt-md-0 d-flex flex-column justify-content-center align-items-md-end">
                <div className="d-inline-block text-center text-md-end">
                  <span className="badge bg-success p-2 mb-2 d-inline-flex align-items-center gap-1">
                    <CheckCircle size={14} /> Active Member
                  </span>
                  <p className="text-muted small mb-0">ID: {currentUser.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="card shadow-sm border-0 mb-4 preference-card">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
              <Settings size={24} className="text-secondary" />
              Shopping Preferences
            </h5>
            <p className="text-muted small mb-3">
              Select categories you are interested in to personalize your home
              feed.
            </p>
            <div className="row g-3">
              {preferences.map((pref) => (
                <div key={pref.id} className="col-md-6 col-lg-3">
                  <div
                    className={`p-3 border rounded pref-item ${
                      pref.interested ? "active-pref" : ""
                    }`}
                    onClick={() => togglePreference(pref.id)}
                  >
                    <div className="form-check form-switch d-flex justify-content-between align-items-center ps-0">
                      <label
                        className="form-check-label fw-bold cursor-pointer"
                        htmlFor={`pref-${pref.id}`}
                      >
                        {pref.category}
                      </label>
                      <input
                        className="form-check-input ms-2 cursor-pointer"
                        type="checkbox"
                        id={`pref-${pref.id}`}
                        checked={pref.interested}
                        onChange={() => togglePreference(pref.id)}
                      />
                    </div>
                    <small className="text-secondary d-block mt-1">
                      {pref.interested
                        ? "Currently showing"
                        : "Hidden from feed"}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
              <ShoppingBag size={24} /> Your Orders
            </h5>

            {userOrders.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr className="border-bottom">
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Tracking</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userOrders.map((order) => (
                      <tr key={order.id} className="align-middle">
                        <td className="fw-bold">{formatOrderId(order.id)}</td>
                        <td>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td>{order.items.length} item(s)</td>
                        <td className="fw-bold text-primary">
                          ₹{(() => {
                            const subtotal = order.items?.reduce((sum, item) => {
                              const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
                              return sum + (price * (item.quantity || 1));
                            }, 0) || parseFloat(order.total) || 0;
                            const tax = subtotal * 0.1;
                            const isPickup = order.storeId != null;
                            const shipping = isPickup ? 0 : (subtotal > 500 ? 0 : 50);
                            const loyaltyDiscount = order.loyaltyDiscount || ((order.loyaltyPointsUsed || 0) / 100);
                            return Math.max(0, subtotal + tax + shipping - loyaltyDiscount).toFixed(2);
                          })()}
                        </td>
                        <td>
                          <span
                            className={`badge rounded-pill ${
                              order.status?.toLowerCase() === "delivered"
                                ? "bg-success"
                                : order.status?.toLowerCase() === "shipped"
                                  ? "bg-info"
                                  : order.status?.toLowerCase() ===
                                        "cancelled" ||
                                      order.status?.toLowerCase() === "refunded"
                                    ? "bg-danger"
                                    : order.status?.toLowerCase() ===
                                          "confirmed" ||
                                        order.status?.toLowerCase() ===
                                          "processing"
                                      ? "bg-primary"
                                      : "bg-warning text-dark"
                            }`}
                          >
                            {(order.status || "pending").toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <small className="text-secondary">
                            {order.trackingStatus}
                          </small>
                        </td>
                        <td>
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => openOrderDetails(order)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5">
                <p className="text-muted">No orders yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Render the extracted component here */}
      {showModal && selectedOrder && (
        <OrderTracking
          order={selectedOrder}
          onClose={closeOrderDetails}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}

export default Profile;
