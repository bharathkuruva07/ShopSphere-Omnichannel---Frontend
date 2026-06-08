/**
 * Shared API Utilities
 * Common error handling used across the application context layer.
 */

export const handleApiError = (error) => {
  const errorResponse = {
    message: "An error occurred",
    status: null,
    data: null,
  };

  if (error.response) {
    // Server responded with error status
    errorResponse.status = error.response.status;
    errorResponse.message = error.response.data?.message || error.message;
    errorResponse.data = error.response.data;
  } else if (error.request) {
    // Request made but no response
    errorResponse.message = "No response from server. Check your connection.";
    errorResponse.status = "NETWORK_ERROR";
  } else {
    // Error in request setup
    errorResponse.message = error.message;
  }

  console.error("API Error:", errorResponse);
  return errorResponse;
};
