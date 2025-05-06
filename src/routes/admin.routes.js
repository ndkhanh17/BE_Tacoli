const express = require("express")
const router = express.Router()
const adminController = require("../controllers/admin.controller")
const { authenticate, authorize } = require("../middlewares/auth")
const { validateAdminUser } = require("../validations/admin.validation")

// All admin routes require authentication and admin role
router.use(authenticate)
router.use(authorize(["admin"]))

// Dashboard
router.get("/dashboard", adminController.getDashboardStats)

// Admin user management
router.get("/users", adminController.getAdminUsers)
router.post("/users", validateAdminUser, adminController.createAdminUser)
router.put("/users/:id", validateAdminUser, adminController.updateAdminUser)
router.delete("/users/:id", adminController.deleteAdminUser)

// Role management
router.get("/roles", adminController.getRoles)
router.post("/roles", adminController.createRole)
router.put("/roles/:id", adminController.updateRole)
router.delete("/roles/:id", adminController.deleteRole)

module.exports = router
