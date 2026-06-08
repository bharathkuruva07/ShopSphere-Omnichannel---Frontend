import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { ShoppingCart, User, LogOut, Home, Menu, X } from "lucide-react";
import "./Navbar.css";

function CustomNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, cart } = useApp();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const totalItemsCount = cart.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
    setShowMobileMenu(false);
  };

  if (location.pathname.includes("/admin")) {
    return null;
  }

  return (
    <nav
      className="navbar navbar-expand-lg navbar-custom sticky-top shadow-sm"
      style={{ backgroundColor: "#f8f9fa" }}
    >
      <div className="container">
        <a
          onClick={() => navigate("/")}
          className="navbar-brand fw-bold cursor-pointer"
          style={{ cursor: "pointer", fontSize: "1.3rem" }}
        >
          <span className="text-primary fw-bold">Shop Sphere</span>
        </a>

        <button
          className="navbar-toggler border-0"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div
          className={`collapse navbar-collapse ${showMobileMenu ? "show" : ""}`}
        >
          <ul className="navbar-nav ms-auto align-items-lg-center gap-4">
            <li className="nav-item">
              <a
                onClick={() => {
                  navigate("/");
                  setShowMobileMenu(false);
                }}
                className="nav-link nav-link-custom d-flex align-items-center gap-2"
                style={{ cursor: "pointer" }}
              >
                <Home size={18} />
                Home
              </a>
            </li>

            {currentUser ? (
              <>
                <li
                  className="nav-item position-relative"
                  onMouseEnter={() => setShowProfile(true)}
                  onMouseLeave={() => setShowProfile(false)}
                >
                  <a
                    onClick={() => {
                      navigate("/profile");
                      setShowMobileMenu(false);
                    }}
                    className="nav-link nav-link-custom d-flex align-items-center gap-2"
                    style={{ cursor: "pointer" }}
                  >
                    <User size={18} />
                    Profile
                  </a>
                </li>

                <li className="nav-item position-relative">
                  <a
                    onClick={() => {
                      navigate("/cart");
                      setShowMobileMenu(false);
                    }}
                    className="nav-link nav-link-custom position-relative d-flex align-items-center gap-2"
                    style={{ cursor: "pointer" }}
                  >
                    <ShoppingCart size={18} />
                    Cart
                    {totalItemsCount > 0 && (
                      <span
                        className="position-absolute top-0 start-100 translate-middle px-2 rounded-pill bg-danger text-white"
                        style={{ fontSize: "0.75rem" }}
                      >
                        {totalItemsCount}
                      </span>
                    )}
                  </a>
                </li>

                <li className="nav-item d-flex gap-2 mt-2 mt-lg-0">
                  {currentUser.role === "ADMIN" && (
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => {
                        navigate("/admin");
                        setShowMobileMenu(false);
                      }}
                    >
                      Admin Panel
                    </button>
                  )}
                  <button
                    className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                    onClick={handleLogout}
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item d-flex gap-2 mt-2 mt-lg-0">
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => {
                    navigate("/login");
                    setShowMobileMenu(false);
                  }}
                >
                  Login
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    navigate("/signup");
                    setShowMobileMenu(false);
                  }}
                >
                  Sign Up
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default CustomNavbar;
