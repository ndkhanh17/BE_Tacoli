const express = require("express")
const router = express.Router()
const userController = require("../controllers/user.controller")
const { authenticate, authorize } = require("../middlewares/auth")
const { validateUserUpdate } = require("../validations/user.validation")

// Protected routes (authenticated users)
router.get("/profile", authenticate, userController.getUserProfile)
router.put("/profile", authenticate, validateUserUpdate, userController.updateUserProfile)
router.put("/change-password", authenticate, userController.changePassword)

// Admin routes
router.get("/", authenticate, authorize(["admin"]), userController.getAllUsers)
router.get("/:id", authenticate, authorize(["admin"]), userController.getUserById)
router.put("/:id", authenticate, authorize(["admin"]), userController.updateUser)
router.delete("/:id", authenticate, authorize(["admin"]), userController.deleteUser)

module.exports = router
