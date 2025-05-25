const { body, validationResult } = require("express-validator")

/**
 * Validate payment creation
 */
exports.validatePayment = [
  body("orderId").notEmpty().withMessage("Order ID is required").isMongoId().withMessage("Invalid order ID format"),

  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method is required")
    .isIn(["cod", "bank_transfer", "momo", "vnpay", "zalopay"])
    .withMessage("Invalid payment method"),

  body("returnUrl").optional().isURL().withMessage("Return URL must be a valid URL"),

  body("cancelUrl").optional().isURL().withMessage("Cancel URL must be a valid URL"),

  // Check for validation errors
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      })
    }
    next()
  },
]

/**
 * Validate refund request
 */
exports.validateRefund = [
  body("reason")
    .notEmpty()
    .withMessage("Refund reason is required")
    .isLength({ min: 10, max: 500 })
    .withMessage("Refund reason must be between 10 and 500 characters"),

  // Check for validation errors
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      })
    }
    next()
  },
]
