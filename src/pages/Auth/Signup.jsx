import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CheckCircle } from "lucide-react"; // Import Lucide icon
import { useApp } from "../../context/AppContext";
import "./Auth.css";

function Signup() {
  const navigate = useNavigate();
  const {
    signup,
    currentUser,
    isLoading,
    error: contextError,
    checkEmail,
  } = useApp();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobileNumber: "",
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State for success popup
  const [showSuccess, setShowSuccess] = useState(false);

  // MEMORY LEAK PREVENTION
  // Safely handles the redirect timer even if the user closes the tab
  useEffect(() => {
    let timer;
    if (showSuccess) {
      timer = setTimeout(() => {
        navigate("/login");
      }, 2000);
    }
    // Cleanup function
    return () => clearTimeout(timer);
  }, [showSuccess, navigate]);

  if (currentUser) {
    navigate("/");
    return null;
  }

  // --- VALIDATION LOGIC ---
  const validateField = (name, value, passwordValue = formData.password) => {
    let error = "";
    switch (name) {
      case "name":
        if (value.trim().length < 2 && value.length > 0)
          error = "Name must be at least 2 characters";
        break;
      case "email":
    
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          error = "Please enter a valid email address";
        break;
      case "mobileNumber":
        if (value && !/^\d{10}$/.test(value))
          error = "Enter a valid 10-digit mobile number";
        break;
      case "password":
        const hasUpperCase = /[A-Z]/.test(value);
        const hasLowerCase = /[a-z]/.test(value);
        const hasNumber = /[0-9]/.test(value);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
          value,
        );
        if (
          value &&
          (value.length < 6 ||
            !hasUpperCase ||
            !hasLowerCase ||
            !hasNumber ||
            !hasSpecialChar)
        ) {
          error = "Password does not meet complexity requirements";
        }
        break;
      case "confirmPassword":
        if (value && value !== passwordValue) {
          error = "Passwords do not match";
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setApiError("");

    let errorMsg = validateField(name, value);

    if (name === "password") {
      const confirmError = validateField(
        "confirmPassword",
        formData.confirmPassword,
        value,
      );
      setErrors((prev) => ({
        ...prev,
        [name]: errorMsg,
        confirmPassword: confirmError,
      }));
    } else {
      setErrors((prev) => ({ ...prev, [name]: errorMsg }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    const formKeys = Object.keys(formData);
    let hasError = false;
    let newErrors = {};

    formKeys.forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        hasError = true;
      } else if (!formData[key]) {
        newErrors[key] = "This field is required";
        hasError = true;
      }
    });

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await checkEmail(formData.email.trim().toLowerCase());
      const isRegistered = response?.data?.exists;
      console.log("Email Check Response:", response);
      if (isRegistered) {
        setApiError("User already exists, try with a new email");
        return;
      }

      await signup({
        name: formData.name.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      // Show success popup (useEffect handles navigation)
      setShowSuccess(true);
    } catch (err) {
      const errMsg =
        err.response?.data?.message || err.message || "Signup failed";
      setApiError(errMsg);
    }
  };

  const getInputClass = (fieldName) => {
    return `form-control py-2 ${errors[fieldName] ? "is-invalid" : ""}`;
  };

  return (
    <div className="auth-page">
      {/* Compact Success Popup Overlay */}
      {showSuccess && (
        <div className="success-overlay">
          <div className="card success-card p-4 text-center shadow-lg">
            <div className="mb-3 text-success">
              <CheckCircle className="success-icon" />
            </div>
            <h4 className="fw-bold text-success">Success!</h4>
            <p className="mb-0 text-secondary">Account created successfully.</p>
            <small className="text-muted mt-2">Redirecting to login...</small>
          </div>
        </div>
      )}

      <div className="container">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-md-5">
            <div className="card auth-card shadow-lg">
              <div className="card-body p-5">
                <h2 className="text-center mb-4 fw-bold">Shop Sphere</h2>
                <h4 className="text-center text-secondary mb-4">
                  Create Account
                </h4>

                {(apiError || contextError) && (
                  <div className="alert alert-danger alert-dismissible fade show">
                    {apiError || contextError}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setApiError("")}
                    ></button>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Name */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className={getInputClass("name")}
                      disabled={isLoading || showSuccess}
                    />
                    {errors.name && (
                      <div className="invalid-feedback">{errors.name}</div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      className={getInputClass("email")}
                      disabled={isLoading || showSuccess}
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email}</div>
                    )}
                  </div>

                  {/* Mobile */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Mobile Number</label>
                    <input
                      type="number"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      placeholder="Enter 10-digit mobile number"
                      className={getInputClass("mobileNumber")}
                      disabled={isLoading || showSuccess}
                    />
                    {errors.mobileNumber && (
                      <div className="invalid-feedback">
                        {errors.mobileNumber}
                      </div>
                    )}
                  </div>

                  {/* Password */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Password</label>
                    <div className="input-group has-validation">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter password"
                        className={getInputClass("password")}
                        disabled={isLoading || showSuccess}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading || showSuccess}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                      {errors.password && (
                        <div className="invalid-feedback d-block text-start">
                          {errors.password}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="mb-4">
                    <label className="form-label fw-bold">
                      Confirm Password
                    </label>
                    <div className="input-group has-validation">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm password"
                        className={getInputClass("confirmPassword")}
                        disabled={isLoading || showSuccess}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        disabled={isLoading || showSuccess}
                      >
                        {showConfirmPassword ? "Hide" : "Show"}
                      </button>
                      {errors.confirmPassword && (
                        <div className="invalid-feedback d-block text-start">
                          {errors.confirmPassword}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-bold mb-3"
                    disabled={
                      isLoading ||
                      showSuccess ||
                      Object.values(errors).some((x) => x)
                    }
                  >
                    {isLoading ? "Creating Account..." : "Sign Up"}
                  </button>
                </form>

                <p className="text-center text-secondary">
                  Already have an account?{" "}
                  {/* Using Link to prevent page reload */}
                  <Link to="/login" className="text-primary fw-bold">
                    Login here
                  </Link>
                </p>

                <div className="alert alert-info mt-3" role="alert">
                  <small className="fw-bold">Password Requirements:</small>
                  <ul
                    className="mb-0 mt-2 ps-3"
                    style={{ fontSize: "0.85rem" }}
                  >
                    <li>
                      Min 6 characters, 1 Uppercase, 1 Lowercase, 1 Number, 1
                      Special Char
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
