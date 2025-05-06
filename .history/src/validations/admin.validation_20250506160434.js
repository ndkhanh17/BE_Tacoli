const { body, validationResult } = require("express-validator")

/**
 * Validate admin user request
 */
exports.validateAdminUser = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),

  body("role").trim().notEmpty().withMessage("Role is required"),

  body("password").optional().trim().isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),

  body("status").optional().isIn(["active", "inactive"]).withMessage("Status must be either active or inactive"),

  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      })
    }
    next()
  },
]
