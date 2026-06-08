import React, { useState, useMemo, useEffect } from "react";
import { useApp } from "../../../context/AppContext";
import {
  Eye,
  CheckCircle,
  Search,
  MapPin,
  User,
  ShoppingBag,
  X,
  Package,
  Store,
} from "lucide-react";
import "./OrderFulfillment.css";

// 1. Logic Flow Definition - Matches backend status transitions
const STATUS_FLOW = {
  home: {
    pending: ["pending", "confirmed", "cancelled"],
    confirmed: ["confirmed", "processing", "cancelled"],
    processing: ["processing", "shipped", "cancelled"],
    shipped: ["shipped", "delivered"],
    delivered: ["delivered", "refunded"],
    cancelled: ["cancelled"],
    refunded: ["refunded"],
  },
  pickup: {
    pending: ["pending", "packing", "cancelled"],
    packing: ["packing", "packed", "cancelled"],
    packed: ["packed", "pickedup", "cancelled"],
    pickedup: ["pickedup"],
    cancelled: ["cancelled"],
  },
};

// Display labels for pickup statuses
const PICKUP_STATUS_LABELS = {
  pending: "Order Received",
  packing: "Packing",
  packed: "Packed & Ready",
  pickedup: "Picked Up",
  cancelled: "Cancelled",
};

// Format order ID to display format (e.g., ORD-00023)
const formatOrderId = (id) => {
  const numId = typeof id === 'string' ? parseInt(id, 10) : id;
  return `ORD-${String(numId).padStart(5, '0')}`;
};

function OrderFulfillment() {
  const { orders, users, stores, updateOrderStatus, fetchAllOrders, updateBackendOrderStatus, fetchStores } = useApp();
  const [backendOrders, setBackendOrders] = useState([]);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [newStatus, setNewStatus] = useState("");
  const [trackingStatus, setTrackingStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Fetch orders from backend
  const fetchBackendOrders = async () => {
    try {
      const ordersList = await fetchAllOrders({
        page: 0,
        size: 100,
        sortBy: "createdAt",
        sortDir: "desc",
      });
      setBackendOrders(ordersList);
    } catch (error) {
      console.error("Failed to fetch backend orders:", error);
    }
  };

  useEffect(() => {
    fetchBackendOrders();
    fetchStores(); // Fetch stores for store pickup details
  }, []);

  const isStorePickup = (order) => {
    // Primary check: Use storeId if available (from backend)
    if (order?.storeId != null) {
      return true;
    }
    // Fallback for legacy/frontend-only orders
    return (
      order?.deliveryMethod === "store" ||
      order?.inStorePickup === true
    );
  };

  // Get store details by storeId
  const getStoreDetails = (storeId) => {
    if (!storeId || !stores) return null;
    return stores.find((s) => String(s.id) === String(storeId));
  };

  const getCustomerName = (order) => {
    if (!order) return "Customer";
    // Use customerName from backend response if available
    if (order.customerName) return order.customerName + (order.customerEmail ? ` (${order.customerEmail})` : "");

    // Fallback: try to get from users array
    if (users) {
      const user = users.find((u) => String(u.id) === String(order.userId));
      if (user?.name) return user.name;
    }
    // Final fallback
    return "Customer #" + order.userId;
  };

  const getStatusBadgeClass = (order) => {
    const status = order.status?.toLowerCase() || "pending";
    const trackingStatus = order.trackingStatus?.toLowerCase() || "";

    // Check for delivered/picked up status
    if (status === "delivered" || trackingStatus === "picked up" || trackingStatus === "delivered") {
      return "bg-success";
    }
    // Check for shipped/in transit status
    if (status === "shipped" || trackingStatus === "shipped" || trackingStatus === "out for delivery") {
      return "bg-info";
    }
    // Check for packed/ready status (store pickup)
    if (trackingStatus === "packed & ready" || trackingStatus === "packed") {
      return "bg-primary";
    }
    // Check for processing/confirmed status
    if (status === "processing" || status === "confirmed" || trackingStatus === "processing" || trackingStatus === "confirmed" || trackingStatus === "packing") {
      return "bg-primary";
    }
    // Check for cancelled/refunded status
    if (status === "cancelled" || status === "refunded" || trackingStatus === "cancelled") {
      return "bg-danger";
    }
    // Pending status
    if (status === "pending" || trackingStatus === "pending" || trackingStatus === "order placed") {
      return "bg-warning text-dark";
    }
    return "bg-secondary";
  };

  // Restored View Logic
  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleOpenStatusModal = (order) => {
    setSelectedOrder(order);
    const isPickup = isStorePickup(order);

    let currentKey = "pending"; // Default
    const status = order.status?.toLowerCase() || "pending";
    const tracking = order.trackingStatus?.toLowerCase() || "";

    if (isPickup) {
      // For pickup orders - use pending, packing, packed, pickedup flow
      if (tracking === "picked up" || status === "delivered") currentKey = "pickedup";
      else if (tracking === "packed & ready" || tracking === "packed") currentKey = "packed";
      else if (tracking === "packing" || status === "processing") currentKey = "packing";
      else if (status === "cancelled") currentKey = "cancelled";
      else currentKey = "pending"; // Default start for pickup
    } else {
      // For home delivery orders - map to backend enums
      if (status === "refunded") currentKey = "refunded";
      else if (status === "delivered") currentKey = "delivered";
      else if (status === "shipped") currentKey = "shipped";
      else if (status === "processing") currentKey = "processing";
      else if (status === "confirmed") currentKey = "confirmed";
      else if (status === "pending") currentKey = "pending";
      else if (status === "cancelled") currentKey = "cancelled";
      else currentKey = "pending"; // Default
    }

    setNewStatus(currentKey);
    setTrackingStatus(tracking);
    setShowStatusModal(true);
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;
    let statusToSave = newStatus.toUpperCase();
    let trackingToSave = trackingStatus;

    if (isStorePickup(selectedOrder)) {
      // For pickup orders, map flow states to backend statuses
      if (newStatus === "pickedup") {
        statusToSave = "DELIVERED";
        trackingToSave = "Picked Up";
      } else if (newStatus === "packed") {
        statusToSave = "CONFIRMED";
        trackingToSave = "Packed & Ready";
      } else if (newStatus === "packing") {
        statusToSave = "PROCESSING";
        trackingToSave = "Packing";
      } else if (newStatus === "pending") {
        statusToSave = "PENDING";
        trackingToSave = "Order Received";
      } else if (newStatus === "cancelled") {
        statusToSave = "CANCELLED";
        trackingToSave = "Cancelled";
      }
    } else {
      // For home delivery, directly map the flow state to backend enum
      statusToSave = newStatus.toUpperCase();
      // Update tracking based on status
      switch (newStatus) {
        case "pending":
          trackingToSave = "Pending";
          break;
        case "confirmed":
          trackingToSave = "Confirmed";
          break;
        case "processing":
          trackingToSave = "Processing";
          break;
        case "shipped":
          trackingToSave = "Shipped";
          break;
        case "delivered":
          trackingToSave = "Delivered";
          break;
        case "cancelled":
          trackingToSave = "Cancelled";
          break;
        case "refunded":
          trackingToSave = "Refunded";
          break;
        default:
          trackingToSave = newStatus;
      }
    }

    try {
      // Update via backend API with both status and trackingStatus
      await updateBackendOrderStatus(
        selectedOrder.id,
        statusToSave,
        trackingToSave
      );

      // Update local state if available
      if (updateOrderStatus) {
        updateOrderStatus(selectedOrder.id, statusToSave, trackingToSave);
      }

      // Refetch orders to get the updated data from backend
      await fetchBackendOrders();
      
      setShowStatusModal(false);
    } catch (error) {
      console.error("Failed to update order status:", error);
      alert("Failed to update order status. Please try again.");
    }
  };

  const filteredOrders = useMemo(() => {
    // Merge backend orders with local orders
    const allOrders = [...backendOrders, ...orders];
    // Remove duplicates by id
    const uniqueOrders = Array.from(
      new Map(allOrders.map((order) => [order.id, order])).values()
    );

    return uniqueOrders
      .filter((order) => {
        const customerName = getCustomerName(order).toLowerCase();
        return (
          order.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
          customerName.includes(searchTerm.toLowerCase())
        );
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [backendOrders, orders, searchTerm, users]);

  const ordersByStatus = {
    pending: filteredOrders.filter((o) => {
      const status = o.status?.toLowerCase();
      return status === "pending" || status === "confirmed" || status === "processing";
    }),
    shipped: filteredOrders.filter((o) => {
      const status = o.status?.toLowerCase();
      const tracking = o.trackingStatus?.toLowerCase() || "";
      return status === "shipped" || tracking === "packed & ready" || tracking === "packing";
    }),
    delivered: filteredOrders.filter((o) => {
      const status = o.status?.toLowerCase();
      const tracking = o.trackingStatus?.toLowerCase() || "";
      return status === "delivered" || tracking === "picked up";
    }),
    cancelled: filteredOrders.filter((o) => {
      const status = o.status?.toLowerCase();
      return status === "cancelled" || status === "refunded";
    }),
  };

  return (
    <div
      className="order-fulfillment p-4"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      <h1 className="fw-bold mb-4">Order Fulfillment</h1>

      <div className="row g-3 mb-4">
        <div className="col-md-12">
          <div className="input-group shadow-sm">
            <span className="input-group-text bg-white border-end-0">
              <Search size={18} />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search ID or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <nav className="nav nav-tabs border-bottom-0 gap-2 mb-4">
        {["all", "pending", "shipped", "delivered", "cancelled"].map((tab) => (
          <button
            key={tab}
            className={`nav-link rounded-pill px-4 ${
              activeTab === tab
                ? "active bg-primary text-white"
                : "bg-white border text-muted"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.toUpperCase()} (
            {tab === "all"
              ? filteredOrders.length
              : ordersByStatus[tab]?.length || 0}
            )
          </button>
        ))}
      </nav>

      {(activeTab === "all" ? filteredOrders : ordersByStatus[activeTab]).map(
        (order) => (
          <div
            key={order.id}
            className="card order-card mb-3 shadow-sm border-0"
          >
            <div className="card-body p-3">
              <div className="row align-items-center">
                <div className="col-md-3">
                  <div className="fw-bold text-primary">{formatOrderId(order.id)}</div>
                  <small className="text-secondary">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </small>
                </div>
                <div className="col-md-3">
                  <div className="fw-light fs-6">{getCustomerName(order)}</div>
                  {isStorePickup(order) ? (
                    <div className="d-flex align-items-center gap-1 mt-1">
                      <Store size={14} className="text-primary" />
                      <small className="text-primary fw-bold">Store Pickup</small>
                      {order.storeId && (
                        <>
                          <MapPin size={12} className="text-muted ms-1" />
                          <small className="text-muted">{getStoreDetails(order.storeId)?.name || `Store #${order.storeId}`}</small>
                        </>
                      )}
                    </div>
                  ) : (
                    <small className="text-muted">
                      <MapPin size={12} /> Home Delivery
                    </small>
                  )}
                </div>
                <div className="col-md-2 fw-bold text-dark">
                  ₹{order.total.toFixed(2)}
                </div>

                <div className="col-md-2 text-center">
                  <span
                    className={`badge ${getStatusBadgeClass(order)} w-100 p-2 text-uppercase`}
                  >
                    {order.trackingStatus ? order.trackingStatus : order.status}
                  </span>
                </div>

                <div className="col-md-2 d-flex align-items-center justify-content-end gap-3 pe-3">
                  <button
                    className="btn p-0 border-0"
                    onClick={() => handleOpenDetails(order)}
                  >
                    <Eye size={22} className="text-primary" />
                  </button>
                  <div style={{ minWidth: "100px" }}>
                    {(() => {
                      const status = order.status?.toLowerCase() || "";
                      const tracking = order.trackingStatus?.toLowerCase() || "";
                      const isCompleted = 
                        status === "delivered" || 
                        status === "cancelled" ||
                        tracking === "picked up" ||
                        tracking === "cancelled";
                      
                      return !isCompleted ? (
                        <button
                          className="btn btn-primary btn-sm px-3 fw-bold rounded"
                          onClick={() => handleOpenStatusModal(order)}
                        >
                          Update
                        </button>
                      ) : (
                        <CheckCircle size={24} className="text-success" />
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* --- MODAL 1: STATUS UPDATE --- */}
      {showStatusModal && selectedOrder && (
        <div className="custom-modal-overlay">
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ width: "100%", maxWidth: "500px" }}
          >
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-bottom">
                <h5 className="fw-bold m-0">
                  Update Status: {formatOrderId(selectedOrder.id)}
                </h5>
                <button
                  className="btn-close"
                  onClick={() => setShowStatusModal(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                {/* Show Store Pickup or Home Delivery details */}
                {isStorePickup(selectedOrder) ? (
                  <div className="p-3 mb-4 rounded" style={{ backgroundColor: "#e7f1ff", border: "1px solid #b6d4fe" }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Store size={20} className="text-primary" />
                      <span className="fw-bold text-primary">Store Pickup</span>
                    </div>
                    <div className="d-flex align-items-start gap-2">
                      <MapPin size={16} className="text-primary mt-1" />
                      <div>
                        {(() => {
                          const store = getStoreDetails(selectedOrder.storeId);
                          return store ? (
                            <>
                              <p className="fw-bold mb-0 text-dark">{store.name}</p>
                              <p className="text-muted mb-0 small">{store.address}</p>
                            </>
                          ) : (
                            <p className="fw-bold mb-0 text-dark">Store #{selectedOrder.storeId}</p>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 mb-4 rounded bg-light border">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <User size={20} className="text-secondary" />
                      <span className="fw-light text-secondary">{getCustomerName(selectedOrder)}</span>
                    </div>
                    <div className="d-flex align-items-start gap-2">
                      <MapPin size={16} className="text-muted mt-1" />
                      <div>
                        <p className="mb-0 small text-dark">{selectedOrder.shippingAddress || "No address provided"}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mb-4 text-center p-3 bg-light rounded">
                  <small className="text-muted d-block text-uppercase">
                    Current Step
                  </small>
                  <span className="fw-bold text-primary h5">
                    {isStorePickup(selectedOrder) && PICKUP_STATUS_LABELS[newStatus] 
                      ? PICKUP_STATUS_LABELS[newStatus] 
                      : newStatus.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold">
                    Select Next Stage
                  </label>
                  <select
                    className="form-select border-primary shadow-sm"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    {(() => {
                      const isPickup = isStorePickup(selectedOrder);
                      const flowType = isPickup ? "pickup" : "home";
                      const options = STATUS_FLOW[flowType][newStatus] || [
                        newStatus,
                      ];

                      return options.map((opt) => {
                        const label = isPickup && PICKUP_STATUS_LABELS[opt] 
                          ? PICKUP_STATUS_LABELS[opt] 
                          : opt.replace(/_/g, " ").toUpperCase();
                        
                        return (
                          <option key={opt} value={opt}>
                            {opt === newStatus
                              ? `Current: ${label}`
                              : `Move to: ${label}`}
                          </option>
                        );
                      });
                    })()}
                  </select>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button
                  className="btn btn-light px-4"
                  onClick={() => setShowStatusModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary px-4 fw-bold"
                  onClick={handleUpdateOrder}
                >
                  Update Stage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: VIEW ORDER DETAILS (RESTORED) --- */}
      {showDetailsModal && selectedOrder && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-container">
            <div className="custom-modal-header">
              <div>
                <h2 className="modal-title">Order Overview</h2>
                <p className="modal-subtitle">
                  Tracking: <span>{formatOrderId(selectedOrder.id)}</span>
                </p>
              </div>
              <button
                className="close-icon-btn"
                onClick={() => setShowDetailsModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="custom-modal-content">
              <div className="modal-left-column">
                <div className="section-header">
                  <ShoppingBag size={20} />
                  <h3 className="m-0">Shipment Items</h3>
                </div>
                <div className="items-list mt-3">
                  <div className="items-table-header">
                    <span>Product Details</span>
                    <span className="text-center">Qty</span>
                    <span className="text-end pe-2">Subtotal</span>
                  </div>
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={item.id || idx} className="item-row">
                      <div className="item-info">
                        <span className="item-name">{item.productName || item.name || `Product #${item.productId}`}</span>
                        <span className="item-price text-muted small">
                          Rate: ₹{item.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="item-qty fw-bold">{item.quantity}</div>
                      <div className="item-total fw-bold text-primary">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-right-column">
                <div className="summary-card">
                  <div className="section-header mb-3">
                    <User size={20} />
                    <h3 className="m-0">Customer Profile</h3>
                  </div>
                  
                  {/* Customer Name */}
                  <div className="bg-white p-3 border rounded mb-3 shadow-sm">
                    <p className="customer-name fw-medium text-secondary mb-0 h5">
                      {getCustomerName(selectedOrder)}
                  
                    </p>
                  </div>

                  {/* Delivery Type - Store Pickup or Home Delivery */}
                  {isStorePickup(selectedOrder) ? (
                    <div className="p-3 mb-3 rounded" style={{ backgroundColor: "#e7f1ff", border: "1px solid #b6d4fe" }}>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <Store size={18} className="text-primary" />
                        <span className="fw-bold text-primary">Store Pickup</span>
                        <span className={`badge ms-auto ${getStatusBadgeClass(selectedOrder)}`}>
                          {selectedOrder.trackingStatus || selectedOrder.status?.toUpperCase() || "PENDING"}
                        </span>
                      </div>
                      <div className="d-flex align-items-start gap-2">
                        <MapPin size={16} className="text-primary mt-1" />
                        <div>
                          {(() => {
                            const store = getStoreDetails(selectedOrder.storeId);
                            return store ? (
                              <>
                                <p className="fw-bold mb-0 text-dark small">{store.name}</p>
                                <p className="text-muted mb-0 small">{store.address}</p>
                              </>
                            ) : (
                              <p className="fw-bold mb-0 text-dark small">Store #{selectedOrder.storeId}</p>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-3 border rounded mb-3 shadow-sm">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="text-muted small fw-bold text-uppercase">Delivery Address</span>
                        <span className={`badge ${getStatusBadgeClass(selectedOrder)}`}>
                          {selectedOrder.trackingStatus || selectedOrder.status?.toUpperCase() || "PENDING"}
                        </span>
                      </div>
                      <div className="d-flex align-items-start gap-2">
                        <MapPin size={16} className="text-muted mt-1" />
                        <div>
                          <p className="text-dark mb-0 small">{selectedOrder.shippingAddress || "No address provided"}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="total-section d-flex justify-content-between align-items-end mb-4">
                    <span className="total-label text-muted small fw-bold">
                      TOTAL AMOUNT
                    </span>
                    <span className="total-value h2 m-0 text-primary fw-bold">
                      ₹{selectedOrder.total.toFixed(2)}
                    </span>
                  </div>
                  <button
                    className="confirm-btn py-3 w-100 btn btn-primary rounded-pill fw-bold shadow-sm"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    Close Summary
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderFulfillment;
