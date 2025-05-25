const express = require("express")
const router = express.Router()
const paymentController = require("../controllers/payment.controller")
const { authenticate, authorize } = require("../middlewares/auth")
const { validatePayment } = require("../validations/payment.validation")

// Public routes
router.post("/callback/:gateway", paymentController.handlePaymentCallback)

// Protected routes (authenticated users)
router.post("/", authenticate, validatePayment, paymentController.createPayment)
router.get("/my-payments", authenticate, paymentController.getUserPayments)
router.get("/:id", authenticate, paymentController.getPaymentById)

// Admin routes
router.get("/", authenticate, authorize(["admin"]), paymentController.getAllPayments)
router.post("/:id/refund", authenticate, authorize(["admin"]), paymentController.refundPayment)
router.get("/admin/stats", authenticate, authorize(["admin"]), paymentController.getPaymentStats)

module.exports = router
