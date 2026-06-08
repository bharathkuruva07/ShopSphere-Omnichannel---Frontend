import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();
  const { logout, login, currentUser, isLoading } = useApp();

  // --- Main Login State ---
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);

  // Redirect if already logged in
  if (currentUser) {
    navigate(currentUser.role === "ADMIN" ? "/admin" : "/");
    return null;
  }

  // --- HANDLERS ---

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user starts typing again
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      const user = await login(formData.email, formData.password);

      const userRole = user.data.data.role;
      console.log(userRole);

      if (isAdminLogin && userRole !== "ADMIN") {
        await logout();
        setError("Access Denied: You are not an Admin.");
        return;
      }
      if (!isAdminLogin && userRole == "ADMIN") {
        await logout();
        setError(
          "Access Denied: This account is an Administrator.please sign in at the Admin Portal.",
        );
        return;
      }
      console.log("over the admin login");
      navigate(userRole === "ADMIN" ? "/admin" : "/");
      console.log("after the admin login");
    } catch (err) {
      // This catches the error and sets the local state, triggering the alert below
      console.error("Login Error Details:", err);
      setError("Login failed: Invalid credentials");
    }
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-md-5">
            <div className="card auth-card shadow-lg">
              <div className="card-body p-5">
                {/* --- HEADER --- */}
                <h2 className="text-center mb-4 fw-bold">Shop Sphere</h2>

                {/* Toggle Buttons */}
                <div className="d-flex justify-content-center mb-4">
                  <div className="btn-group" role="group">
                    <button
                      type="button"
                      className={`btn ${
                        !isAdminLogin ? "btn-primary" : "btn-outline-primary"
                      }`}
                      onClick={() => setIsAdminLogin(false)}
                    >
                      Customer
                    </button>
                    <button
                      type="button"
                      className={`btn ${
                        isAdminLogin ? "btn-primary" : "btn-outline-primary"
                      }`}
                      onClick={() => setIsAdminLogin(true)}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                <h4 className="text-center text-secondary mb-4">
                  {isAdminLogin ? "Admin Login" : "Customer Login"}
                </h4>

                {/* --- ERROR MESSAGES --- */}
                {/* This is the single source of truth for errors now */}
                {error && (
                  <div className="alert alert-danger alert-dismissible fade show">
                    {error}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setError("")}
                    ></button>
                  </div>
                )}

                {/* --- LOGIN FORM --- */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={
                        isAdminLogin ? "Enter admin email" : "Enter your email"
                      }
                      className="form-control py-2"
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label fw-bold">Password</label>
                    <div className="input-group">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter password"
                        className="form-control py-2"
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        disabled={isLoading}
                      >
                        {showLoginPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password Link - Navigates to Verify Email */}
                  <div className="d-flex justify-content-end mb-4">
                    <button
                      type="button"
                      className="btn btn-link text-decoration-none p-0 small text-secondary"
                      onClick={() => navigate("/verify-email")}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-bold mb-3"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? "Logging in..."
                      : `Login as ${isAdminLogin ? "Admin" : "Customer"}`}
                  </button>
                </form>

                {/* --- FOOTER --- */}
                {!isAdminLogin && (
                  <p className="text-center text-secondary mb-3">
                    Don't have an account?{" "}
                    <a href="/signup" className="text-primary fw-bold">
                      Sign up here
                    </a>
                  </p>
                )}

                {isAdminLogin && (
                  <div className="alert alert-info mt-4" role="alert">
                    <small className="fw-bold">Demo Admin Credentials:</small>
                    <br />
                    <small>
                      <strong>Email:</strong> admin@shop.com
                    </small>
                    <br />
                    <small>
                      <strong>Password:</strong> admin123
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
