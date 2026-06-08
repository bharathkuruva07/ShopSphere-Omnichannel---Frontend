import React, { useMemo } from "react";
import ReactDOM from "react-dom"; // Import ReactDOM
import "./OrderTracking.css";
import {
  X,
  Package,
  ShoppingBag,
  CheckCircle,
  Calendar,
  CreditCard,
  Gift,
  Store,
  MapPin,
  Truck,
} from "lucide-react";

// Helper function to check if order is store pickup
const isStorePickup = (order) => {
  if (order?.storeId != null) return true;
  return (
    order?.deliveryMethod === "store" ||
    order?.inStorePickup === true ||
    (order?.shippingAddress?.name &&
      order?.shippingAddress.name.includes("TechHaven")) ||
    (order?.shippingAddress?.id && order?.shippingAddress?.distance)
  );
};

// Get display status for store pickup orders
const getPickupStatusLabel = (order) => {
  const tracking = order.trackingStatus?.toLowerCase() || "";
  const status = order.status?.toLowerCase() || "";

  if (status === "cancelled") return "Cancelled";
  if (status === "delivered" || tracking === "picked up") return "Picked Up";
  if (tracking === "packed & ready" || tracking === "packed")
    return "Packed & Ready";
  if (tracking === "packing") return "Packing";
  return "Order Received";
};

// Get badge class based on order status
const getStatusBadgeClass = (order) => {
  const status = order.status?.toLowerCase() || "";
  const tracking = order.trackingStatus?.toLowerCase() || "";

  if (status === "delivered" || tracking === "picked up") return "bg-success";
  if (status === "cancelled" || status === "refunded") return "bg-danger";
  if (status === "shipped" || tracking === "out for delivery") return "bg-info";
  if (tracking === "packed & ready" || tracking === "packed")
    return "bg-primary";
  if (status === "processing" || tracking === "packing") return "bg-info";
  if (status === "confirmed") return "bg-primary";
  return "bg-warning text-dark";
};

// Format order ID to display format (e.g., ORD-00023)
const formatOrderId = (id) => {
  const numId = typeof id === "string" ? parseInt(id, 10) : id;
  return `ORD-${String(numId).padStart(5, "0")}`;
};

const OrderTracking = ({ order, onClose, currentUser }) => {
  // 1. Return null if no order is selected (Modal is closed)
  if (!order) return null;

  const isPickup = isStorePickup(order);

  // Check if order is completed (Delivered or Picked Up) - loyalty points are released
  const isOrderCompleted = useMemo(() => {
    const status = order.status?.toLowerCase() || "";
    const tracking = order.trackingStatus?.toLowerCase() || "";
    return status === "delivered" || tracking === "picked up" || tracking === "delivered";
  }, [order.status, order.trackingStatus]);

  // Check if loyalty points have been released (from backend loyaltyPointsStatus)
  const arePointsReleased = useMemo(() => {
    return order.loyaltyPointsStatus === "RELEASED" || isOrderCompleted;
  }, [order.loyaltyPointsStatus, isOrderCompleted]);

  // 2. Logic: Calculate Totals
  const subtotal = useMemo(() => {
    return order.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );
  }, [order.items]);

  const tax = subtotal * 0.1;

  // Read loyalty points used from backend (loyaltyPointsUsed) or local orders (usedLoyaltyPoints)
  const usedLoyaltyPoints =
    order.loyaltyPointsUsed || order.usedLoyaltyPoints || 0;

  // Calculate loyalty discount: 100 points = ₹1
  const loyaltyDiscount =
    order.loyaltyDiscount ||
    (usedLoyaltyPoints > 0 ? usedLoyaltyPoints / 100 : 0);

  // Shipping: store pickup = free, online = free if subtotal > 500, else ₹50
  const shipping = useMemo(() => {
    if (isPickup) return 0;
    return subtotal > 500 ? 0 : 50;
  }, [isPickup, subtotal]);

  // Total = subtotal + tax + shipping - loyaltyDiscount (matches Cart.jsx logic)
  const calculatedTotal = Math.max(
    0,
    subtotal + tax + shipping - loyaltyDiscount,
  );

  // Get loyalty points earned (from backend or calculated)
  const loyaltyPointsEarned = order.loyaltyPointsEarned ?? Math.floor(subtotal / 100) * 10;

  // 3. The JSX Content (The Modal)
  const modalContent = (
    <div className="custom-modal-overlay" onClick={onClose}>
      <div
        className="custom-modal-box shadow-lg"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside content
      >
        {/* Modal Header */}
        <div className="modal-header border-bottom px-4 py-3 d-flex justify-content-between align-items-center bg-white">
          <div>
            <h4 className="fw-bold mb-0">Order Details</h4>
            <p className="text-muted small mb-0">
              ID:{" "}
              <span className="font-monospace text-dark">
                {formatOrderId(order.id)}
              </span>
            </p>
          </div>
          <button
            type="button"
            className="btn btn-light rounded-circle p-2 border"
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body p-0 d-flex flex-column flex-lg-row h-100 overflow-hidden">
          {/* LEFT SIDE: Items List */}
          <div className="col-lg-7 p-4 overflow-auto custom-scrollbar bg-white">
            <div className="d-flex align-items-center gap-2 mb-4">
              <span className="text-primary">
                <Package size={24} />
              </span>
              <h5 className="fw-bold mb-0">Items in Shipment</h5>
            </div>

            <div className="table-responsive">
              <table className="table align-middle">
                <thead className="text-uppercase text-muted small bg-light">
                  <tr>
                    <th className="border-0 py-3 ps-3 rounded-start">
                      Product Info
                    </th>
                    <th className="border-0 py-3 text-center">Qty</th>
                    <th className="border-0 py-3 text-end">Price</th>
                    <th className="border-0 py-3 text-end rounded-end pe-3">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id || item.productId}>
                      <td className="py-4 ps-3">
                        <div className="d-flex align-items-center">
                          <div
                            className="bg-light rounded-3 p-3 me-3 d-flex align-items-center justify-content-center border"
                            style={{ width: "60px", height: "60px" }}
                          >
                            <ShoppingBag size={28} className="text-secondary" />
                          </div>
                          <div>
                            <span className="fw-bold d-block text-dark h6 mb-1">
                              {item.productName || item.name || `Product #${item.productId || item.id}`}
                            </span>
                            <span className="badge bg-light text-secondary border">
                              ID: {item.productId || item.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-4 fs-5">{item.quantity}</td>
                      <td className="text-end py-4 text-muted">
                        ₹{item.price.toFixed(2)}
                      </td>
                      <td className="text-end fw-bold py-4 pe-3 fs-5">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT SIDE: Summary */}
          <div className="col-lg-5 bg-light border-start p-4 d-flex flex-column h-100 overflow-auto">
            <div>
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                <CheckCircle size={20} className="text-success" /> Order Summary
              </h5>

              {/* Status Badge */}
              <div className="bg-white p-4 rounded-3 border mb-4 shadow-sm position-relative">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-muted small fw-bold text-uppercase">
                    Current Status
                  </span>
                  <span
                    className={`badge rounded-pill ${getStatusBadgeClass(order)}`}
                  >
                    {isStorePickup(order)
                      ? getPickupStatusLabel(order)
                      : (order.status || "pending").toUpperCase()}
                  </span>
                </div>
                {isStorePickup(order) && (
                  <div className="mb-2">
                    <span className="badge bg-light text-primary border">
                      <Store size={12} className="me-1" /> Store Pickup
                    </span>
                  </div>
                )}
                <div className="d-flex align-items-center gap-2 text-muted small">
                  <Calendar size={14} />
                  <span>
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="vstack gap-4">
                {/* Shipping Address or Store Pickup Location */}
                {isStorePickup(order) ? (
                  <div>
                    <h6 className="text-uppercase text-muted small fw-bold mb-2">
                      <Store size={14} className="me-1" /> Pickup Location
                    </h6>
                    <div className="bg-white p-3 rounded border">
                      {order.storeName ? (
                        <>
                          <p className="fw-bold mb-1 text-dark">
                            {order.storeName}
                          </p>
                          {order.storeAddress && (
                            <p className="text-muted mb-1 small">
                              {order.storeAddress}
                            </p>
                          )}
                        </>
                      ) : order.shippingAddress ? (
                        typeof order.shippingAddress === 'string' ? (
                          // New plain text format - display as store info
                          <p className="fw-bold mb-1 text-dark">
                            {order.shippingAddress || `Store Pickup (Store #${order.storeId})`}
                          </p>
                        ) : (
                          // Legacy JSON object format for store
                          <>
                            <p className="fw-bold mb-1 text-dark">
                              {order.shippingAddress.name ||
                                order.shippingAddress.address ||
                                "Store Pickup"}
                            </p>
                            {(order.shippingAddress.address || order.shippingAddress.line1) && (
                              <p className="text-muted mb-1 small">
                                {order.shippingAddress.address || order.shippingAddress.line1}
                                {order.shippingAddress.distance && ` • ${order.shippingAddress.distance}`}
                              </p>
                            )}
                          </>
                        )
                      ) : (
                        <p className="fw-bold mb-1 text-dark">
                          Store Pickup (Store #{order.storeId})
                        </p>
                      )}
                      <div className="mt-3 pt-2 border-top">
                        <small className="text-muted d-block mb-1">
                          <Calendar size={12} className="me-1" />
                          Please bring your order ID for pickup
                        </small>
                        <small className="text-success fw-bold">
                          Store Hours: 10:00 AM - 9:00 PM
                        </small>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h6 className="text-uppercase text-muted small fw-bold mb-2">
                      Shipping Address
                    </h6>
                    <div className="bg-white p-3 rounded border">
                      <p className="fw-bold mb-1 text-dark">
                        {currentUser.name}
                      </p>
                      {order?.shippingAddress && (
                        typeof order.shippingAddress === 'string' ? (
                          // New plain text format
                          <p className="text-muted mb-0 small">
                            {order.shippingAddress}
                          </p>
                        ) : (
                          // Legacy JSON object format
                          <>
                            <p className="text-muted mb-1 small">
                              {order.shippingAddress.address ||
                                order.shippingAddress.name}
                            </p>
                            <p className="text-muted mb-0 small">
                              {order.shippingAddress.line1}{" "}
                              {order.shippingAddress.state}{" "}
                              {order.shippingAddress.pinCode ||
                                order.shippingAddress.pincode}
                            </p>
                          </>
                        )
                      )}
                      <p className="text-primary mt-2 mb-0 small fw-bold">
                        <span className="text-muted fw-normal">Phone:</span>{" "}
                        {currentUser.mobileNumber}
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment Info */}
                <div>
                  <h6 className="text-uppercase text-muted small fw-bold mb-2">
                    Payment Info
                  </h6>
                  <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                    <span className="text-dark small d-flex align-items-center gap-2">
                      <CreditCard size={16} /> Method
                    </span>
                    <span className="fw-bold text-dark text-uppercase">
                      {order.paymentMethod}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Totals */}
            <div className="mt-auto pt-4 border-top">
              {/* Loyalty Points Section - Shows earned points prominently when order is delivered/picked up */}
              {arePointsReleased ? (
                <div className="bg-success bg-opacity-10 border border-success rounded-3 p-3 mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-success fw-bold d-flex align-items-center gap-2">
                      <Gift size={20} /> Points Credited!
                    </span>
                    <span className="text-success fw-bold fs-5">
                      +{loyaltyPointsEarned} pts
                    </span>
                  </div>
                  <small className="text-success opacity-75 d-block mt-1">
                    These loyalty points have been added to your account
                  </small>
                </div>
              ) : (
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-muted small fw-bold d-flex align-items-center gap-2">
                    <Gift size={16} /> Points to Earn
                  </span>
                  <span className="text-muted fw-bold">
                    +{loyaltyPointsEarned} pts
                    <small className="d-block text-end" style={{ fontSize: '10px' }}>
                      (on delivery)
                    </small>
                  </span>
                </div>
              )}

              {/* Cost Breakdown */}
              <div className="d-flex justify-content-between mb-1 text-muted small">
                <span>
                  Subtotal ({order.items.length} item
                  {order.items.length > 1 ? "s" : ""})
                </span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-1 text-muted small">
                <span>Tax (10%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-1 text-muted small">
                <span>Shipping</span>
                <span>
                  {shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}
                </span>
              </div>

              {usedLoyaltyPoints > 0 && (
                <div className="d-flex justify-content-between mb-1 text-muted small">
                  <span>Loyalty Points Used</span>
                  <span>{usedLoyaltyPoints} pts</span>
                </div>
              )}

              {loyaltyDiscount > 0 && (
                <div className="d-flex justify-content-between mb-3 text-success small">
                  <span>Loyalty Discount</span>
                  <span>-₹{loyaltyDiscount.toFixed(2)}</span>
                </div>
              )}

              {/* Final Total */}
              <div className="d-flex justify-content-between align-items-end pt-3 border-top">
                <span className="fw-bold">Total Amount</span>
                <span className="fs-4 fw-bold text-primary">
                  ₹{calculatedTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 4. THE PORTAL MAGIC: Render 'modalContent' into the DOM node 'portal-root'
  return ReactDOM.createPortal(
    modalContent,
    document.getElementById("portal-root") || document.body,
  );
};

export default OrderTracking;
