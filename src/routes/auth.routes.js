const express = require("express")
const router = express.Router()
const authController = require("../controllers/auth.controller")
const { validateRegistration, validateLogin } = require("../validations/auth.validation")

// Auth routes
router.post("/register", validateRegistration, authController.register)
router.post("/login", validateLogin, authController.login)
router.post("/logout", authController.logout)
router.get("/me", authController.getCurrentUser)
router.post("/forgot-password", authController.forgotPassword)
router.post("/reset-password", authController.resetPassword)

module.exports = router
