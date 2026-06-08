import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import {
  BarChart3,
  Package,
  ShoppingCart,
  Sliders,
  LogOut,
  Menu,
  X,
  Store,
} from "lucide-react";
import "./AdminLayout.css";

function AdminLayout({ children }) {
  const navigate = useNavigate();
  const { currentUser, logout } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!currentUser || currentUser.role !== "ADMIN") {
    return (
      <div className="container py-5 text-center">
        <h2 className="mb-3">Access Denied. Admin area only.</h2>
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          Go to Home
        </button>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navigationItems = [
    { label: "Dashboard", icon: BarChart3, path: "/admin" },
    { label: "Inventory", icon: Package, path: "/admin/inventory" },
    { label: "Orders", icon: ShoppingCart, path: "/admin/orders" },
    { label: "Campaigns", icon: BarChart3, path: "/admin/campaigns" },
    { label: "Stores", icon: Store, path: "/admin/stores" },
    // { label: 'S', icon: Sliders, path: '/admin/settings' }
  ];

  return (
    <div className="admin-layout">
      {/* Header */}
      <nav className="navbar admin-header shadow-sm sticky-top">
        <div className="container-fluid">
          <button
            className="btn btn-link p-0 text-dark"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="navbar-brand ms-3 fw-bold">
            <span className="text-primary">ShopSphere</span> Admin
          </div>
          <div className="ms-auto d-flex align-items-center gap-3">
            <span className="text-secondary small">
              Welcome, <strong>{currentUser.name}</strong>
            </span>
            <button
              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="d-flex">
        {/* Sidebar */}
        <div className={`admin-sidebar ${sidebarOpen ? "show" : "hide"}`}>
          <nav className="nav flex-column gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.path}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                  }}
                  className="admin-nav-link nav-link py-3 px-4 d-flex align-items-center gap-3"
                >
                  <Icon size={20} />
                  <span className="fw-500">{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="admin-main flex-grow-1">{children}</div>
      </div>
    </div>
  );
}

export default AdminLayout;
