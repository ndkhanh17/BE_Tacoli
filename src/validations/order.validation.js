const { body, validationResult } = require("express-validator")

/**
 * Validate order request
 */
exports.validateOrder = [
  body("customerInfo")
    .notEmpty()
    .withMessage("Customer information is required")
    .isObject()
    .withMessage("Customer information must be an object"),

  body("customerInfo.fullName")
    .notEmpty()
    .withMessage("Full name is required")
    .isString()
    .withMessage("Full name must be a string"),

  body("customerInfo.email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),

  body("customerInfo.phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[0-9]{10,11}$/)
    .withMessage("Please provide a valid phone number"),

  body("customerInfo.address")
    .notEmpty()
    .withMessage("Address is required")
    .isString()
    .withMessage("Address must be a string"),

  body("items").notEmpty().withMessage("Order items are required").isArray().withMessage("Items must be an array"),

  body("items.*.productId")
    .notEmpty()
    .withMessage("Product ID is required for each item")
    .isString()
    .withMessage("Product ID must be a string"),

  body("items.*.quantity")
    .notEmpty()
    .withMessage("Quantity is required for each item")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),

  body("shippingMethod")
    .notEmpty()
    .withMessage("Shipping method is required")
    .isIn(["standard", "express"])
    .withMessage("Shipping method must be either standard or express"),

  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method is required")
    .isIn(["cod", "bank", "momo"])
    .withMessage("Payment method must be valid"),

  body("subtotal")
    .notEmpty()
    .withMessage("Subtotal is required")
    .isFloat({ min: 0 })
    .withMessage("Subtotal must be a positive number"),

  body("shippingFee")
    .notEmpty()
    .withMessage("Shipping fee is required")
    .isFloat({ min: 0 })
    .withMessage("Shipping fee must be a positive number"),

  body("total")
    .notEmpty()
    .withMessage("Total is required")
    .isFloat({ min: 0 })
    .withMessage("Total must be a positive number"),

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
