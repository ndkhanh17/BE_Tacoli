const express = require("express")
const router = express.Router()
const userController = require("../controllers/user.controller")
const { authenticate, authorize } = require("../middlewares/auth")
const { validateUserUpdate } = require("../validations/user.validation")

// Public routes
// None

// Protected routes (require authentication)
router.use(authenticate)

// User profile routes
router.get("/profile", userController.getUserProfile)
router.put("/profile", validateUserUpdate, userController.updateUserProfile)
router.put("/change-password", userController.changePassword)

// Admin only routes
router.use(authorize(["admin"]))
router.get("/", userController.getAllUsers)
router.get("/:id", userController.getUserById)
router.put("/:id", validateUserUpdate, userController.updateUser)
router.delete("/:id", userController.deleteUser)

module.exports = router
