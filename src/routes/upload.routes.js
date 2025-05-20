const express = require("express")
const router = express.Router()
const uploadController = require("../controllers/upload.controller")
const upload = require("../middlewares/upload")
const { authenticate, authorize } = require("../middlewares/auth")

// Upload một hình ảnh sản phẩm
router.post(
  "/products/image",
  authenticate,
  authorize(["admin"]),
  upload.single("image"),
  uploadController.uploadProductImage,
)

// Upload nhiều hình ảnh sản phẩm
router.post(
  "/products/images",
  authenticate,
  authorize(["admin"]),
  upload.array("images", 5), // Tối đa 5 hình
  uploadController.uploadMultipleProductImages,
)

module.exports = router
