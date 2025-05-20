const express = require("express")
const router = express.Router()
const productController = require("../controllers/product.controller")
const { authenticate, authorize } = require("../middlewares/auth")

// Routes công khai
router.get("/", productController.getAllProducts)
router.get("/categories", productController.getProductCategories)
router.get("/price-range", productController.getProductPriceRange)
router.get("/:id", productController.getProductById)

// Routes yêu cầu quyền admin
router.post("/", authenticate, authorize(["admin"]), productController.createProduct)
router.put("/:id", authenticate, authorize(["admin"]), productController.updateProduct)
router.delete("/:id", authenticate, authorize(["admin"]), productController.deleteProduct)

module.exports = router
