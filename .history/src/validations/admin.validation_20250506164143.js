const { ApiError } = require("../utils/ApiError")

/**
 * Validate admin user creation/update
 */
exports.validateAdminUser = (req, res, next) => {
  const { name, email, password, role } = req.body
  const errors = []

  // Validate name
  if (!name || typeof name !== "string" || name.length < 2 || name.length > 50) {
    errors.push("Name must be between 2 and 50 characters")
  }

  // Validate email
  if (!email || typeof email !== "string" || !email.match(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
    errors.push("Please provide a valid email address")
  }

  // Validate password (only for creation)
  if (!req.params.id && (!password || typeof password !== "string" || password.length < 6)) {
    errors.push("Password must be at least 6 characters")
  }

  // Validate role
  const validRoles = ["admin", "editor"]
  if (role && !validRoles.includes(role)) {
    errors.push(`Role must be one of: ${validRoles.join(", ")}`)
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors.join(", ")))
  }

  next()
}

/**
 * Validate role creation/update
 */
exports.validateRole = (req, res, next) => {
  const { name, permissions } = req.body
  const errors = []

  // Validate name
  if (!name || typeof name !== "string" || name.length < 2 || name.length > 30) {
    errors.push("Name must be between 2 and 30 characters")
  }

  // Validate permissions
  if (permissions && !Array.isArray(permissions)) {
    errors.push("Permissions must be an array")
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors.join(", ")))
  }

  next()
}
