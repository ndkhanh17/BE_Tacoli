const express = require("express")
const router = express.Router()

// Import route modules
const authRoutes = require("./auth.routes")
const productRoutes = require("./product.routes")
const categoryRoutes = require("./category.routes")
const orderRoutes = require("./order.routes")
const userRoutes = require("./user.routes")
const postRoutes = require("./post.routes")
const adminRoutes = require("./admin.routes")

// Define routes
router.use("/auth", authRoutes)
router.use("/products", productRoutes)
router.use("/categories", categoryRoutes)
router.use("/orders", orderRoutes)
router.use("/users", userRoutes)
router.use("/posts", postRoutes)
router.use("/admin", adminRoutes)

// Health check route
router.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "API is running" })
})

module.exports = router
