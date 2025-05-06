const { body, validationResult } = require("express-validator")

/**
 * Validate post request
 */
exports.validatePost = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),

  body("excerpt")
    .trim()
    .notEmpty()
    .withMessage("Excerpt is required")
    .isLength({ max: 500 })
    .withMessage("Excerpt must not exceed 500 characters"),

  body("content").trim().notEmpty().withMessage("Content is required"),

  body("category").trim().notEmpty().withMessage("Category is required"),

  body("author").trim().notEmpty().withMessage("Author is required"),

  body("tags").optional().isArray().withMessage("Tags must be an array"),

  body("featured").optional().isBoolean().withMessage("Featured must be a boolean value"),

  body("status").optional().isIn(["draft", "published"]).withMessage("Status must be either draft or published"),

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
