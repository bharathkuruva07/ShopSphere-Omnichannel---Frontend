import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../../context/AppContext";
import "../Auth.css";

function VerifyEmail() {
  const navigate = useNavigate();

  // Get logic from Context
  const {
    checkEmail,
    triggerOtp,
    validateOtp,
    isLoading,
    error: contextError,
  } = useApp();

  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // UI State
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");

  // Step 1: Check Email & Request OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLocalError("");
    setSuccessMsg("");

    try {
      // 1. Check if email exists in DB
      const exists = await checkEmail(email);

      console.log("Email Exists:", exists);
      const isRegistered = exists?.data?.exists;

      if (!isRegistered) {
        setLocalError("Email not found. Please register first.");
        return;
      }

      // Trigger OTP if email exists
      const responseData = await triggerOtp(email);

      // Extract OTP from the response 'data' field
      const otpCode = responseData?.data;

      // 4. Display OTP in success message
      setSuccessMsg(`OTP sent to ${email}. Your OTP is: ${otpCode}`);
      setIsOtpSent(true);
    } catch (err) {
      console.error("Send OTP Error:", err);
      // Context handles the main 'error' state, but we can catch specifics here if needed
    }
  };

  // Step 2: Verify OTP via Backend
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLocalError("");

    try {
      await validateOtp(email, enteredOtp);
      setSuccessMsg("OTP Verified! Redirecting...");

      setTimeout(() => {
        navigate("/reset-password", {
          state: { email: email, otpVerified: true },
        });
      }, 1500);
    } catch (err) {
      setLocalError("Invalid OTP . Please try again.");
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
                  {isOtpSent ? "Enter OTP" : "Verify Email"}
                </h4>

                {/* Combined Errors: Context Error or Local Error */}
                {(contextError || localError) && (
                  <div className="alert alert-danger">
                    {localError || contextError}
                  </div>
                )}

                {/* Success Message (Shows OTP) */}
                {successMsg && (
                  <div className="alert alert-success text-center fw-bold">
                    {successMsg}
                  </div>
                )}

                <form onSubmit={isOtpSent ? handleVerifyOtp : handleSendOtp}>
                  {/* Email Input */}
                  <div className="mb-4">
                    <label className="form-label fw-bold">Email Address</label>
                    <input
                      type="email"
                      className="form-control py-2"
                      placeholder="Enter registered email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isOtpSent || isLoading}
                    />
                  </div>

                  {/* OTP Input */}
                  {isOtpSent && (
                    <div className="mb-4">
                      <label className="form-label fw-bold">
                        One Time Password
                      </label>
                      <input
                        type="text"
                        className="form-control py-2"
                        placeholder="Enter 6-digit OTP"
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value)}
                        required
                        maxLength="6"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-bold"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? "Processing..."
                      : isOtpSent
                        ? "Verify OTP"
                        : "Get OTP"}
                  </button>
                </form>

                <div className="text-center mt-3">
                  <a
                    href="/login"
                    className="text-secondary text-decoration-none"
                  >
                    Back to Login
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
