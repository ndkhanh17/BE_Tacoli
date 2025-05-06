const { body, validationResult } = require("express-validator")

/**
 * Validate user update request
 */
exports.validateUserUpdate = [
  body("name").optional().trim().isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),

  body("email").optional().trim().isEmail().withMessage("Please provide a valid email address"),

  body("phone")
    .optional()
    .trim()
    .matches(/^[0-9]{10,11}$/)
    .withMessage("Please provide a valid phone number"),

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
