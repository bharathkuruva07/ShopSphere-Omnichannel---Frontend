import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../../../context/AppContext";
import "../Auth.css";

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  console.log(location);
  const email = location.state?.email || "";
  const { updatePassword } = useApp();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Redirect if no email is found (security check)
  useEffect(() => {
    if (!email) {
      navigate("/verify-email");
    }
  }, [email, navigate]);

  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      password,
    );
    return (
      password.length >= 6 &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      hasSpecialChar
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validatePassword(formData.password)) {
      setError(
        "Password must have 6+ chars, Upper, Lower, Number & Special char.",
      );
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await updatePassword(email, formData.password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-md-5">
            <div className="card auth-card shadow-lg">
              <div className="card-body p-5">
                <h4 className="text-center text-secondary mb-4">
                  Reset Password
                </h4>

                {error && <div className="alert alert-danger">{error}</div>}

                {success ? (
                  <div className="alert alert-success text-center">
                    <strong>Success!</strong> Password updated. Redirecting to
                    login...
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label fw-bold">New Password</label>
                      <div className="input-group">
                        <input
                          type={showPass ? "text" : "password"}
                          className="form-control"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          required
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowPass(!showPass)}
                        >
                          {showPass ? "Hide" : "Show"}
                        </button>
                      </div>
                      <small
                        className="text-muted"
                        style={{ fontSize: "0.75rem" }}
                      >
                        Min 6 chars, Upper, Lower, Number & Special required.
                      </small>
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-bold">
                        Confirm Password
                      </label>
                      <input
                        type={showPass ? "text" : "password"}
                        className="form-control"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-100 py-2 fw-bold"
                      disabled={isLoading}
                    >
                      {isLoading ? "Updating..." : "Set New Password"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
