const express = require("express")
const router = express.Router()
const categoryController = require("../controllers/category.controller")
const { authenticate, authorize } = require("../middlewares/auth")
const { validateCategory } = require("../validations/category.validation")

// Public routes
router.get("/", categoryController.getAllCategories)
router.get("/:id", categoryController.getCategoryById)

// Protected routes (admin only)
router.post("/", authenticate, authorize(["admin"]), validateCategory, categoryController.createCategory)
router.put("/:id", authenticate, authorize(["admin"]), validateCategory, categoryController.updateCategory)
router.delete("/:id", authenticate, authorize(["admin"]), categoryController.deleteCategory)

module.exports = router
