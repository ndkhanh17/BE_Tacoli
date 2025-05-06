const express = require("express")
const router = express.Router()
const productController = require("../controllers/product.controller")
const { authenticate, authorize } = require("../middlewares/auth")
const { validateProduct } = require("../validations/product.validation")

// Public routes
router.get("/", productController.getAllProducts)
router.get("/:id", productController.getProductById)
router.get("/category/:categoryId", productController.getProductsByCategory)
router.get("/search", productController.searchProducts)

// Protected routes (admin only)
router.post("/", authenticate, authorize(["admin"]), validateProduct, productController.createProduct)
router.put("/:id", authenticate, authorize(["admin"]), validateProduct, productController.updateProduct)
router.delete("/:id", authenticate, authorize(["admin"]), productController.deleteProduct)

module.exports = router
