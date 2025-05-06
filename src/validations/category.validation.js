const { body, validationResult } = require("express-validator")

/**
 * Validate category request
 */
exports.validateCategory = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Category name must be between 2 and 50 characters"),

  body("description").optional().trim(),

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
