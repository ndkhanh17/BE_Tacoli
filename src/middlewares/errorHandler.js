/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err)

  // Default error status and message
  let statusCode = err.statusCode || 500
  let message = err.message || "Internal Server Error"

  // Handle MongoDB errors
  if (err.name === "MongoError" || err.name === "MongoServerError") {
    statusCode = 500
    message = "Database error occurred"

    // Handle duplicate key error
    if (err.code === 11000) {
      statusCode = 400
      message = "Duplicate entry found"
    }
  }

  // Handle validation errors
  if (err.name === "ValidationError") {
    statusCode = 400
    message = err.message
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401
    message = "Invalid or expired token"
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  })
}

module.exports = errorHandler
