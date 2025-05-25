const express = require("express")
const router = express.Router()

// Import routes
const authRoutes = require("./auth.routes")
const productRoutes = require("./product.routes")
const categoryRoutes = require("./category.routes")
const orderRoutes = require("./order.routes")
const userRoutes = require("./user.routes")
const postRoutes = require("./post.routes")
const uploadRoutes = require("./upload.routes")
const paymentRoutes = require("./payment.routes")
const contactRoutes = require("./contact.routes")

// Đăng ký routes
router.use("/auth", authRoutes)
router.use("/products", productRoutes)
router.use("/categories", categoryRoutes)
router.use("/orders", orderRoutes)
router.use("/users", userRoutes)
router.use("/posts", postRoutes)
router.use("/upload", uploadRoutes)
router.use("/payments", paymentRoutes)
router.use("/contacts", contactRoutes)

// Health check
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API đang hoạt động",
    timestamp: new Date(),
  })
})

module.exports = router
