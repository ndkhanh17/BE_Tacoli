const express = require("express")
const router = express.Router()
const orderController = require("../controllers/order.controller")
const { authenticate, authorize } = require("../middlewares/auth")
const { validateOrder } = require("../validations/order.validation")

// Customer routes
router.post("/", authenticate, validateOrder, orderController.createOrder)
router.get("/track/:orderId", orderController.trackOrder)

// Protected routes (authenticated users)
router.get("/my-orders", authenticate, orderController.getUserOrders)
router.get("/my-orders/:id", authenticate, orderController.getUserOrderById)

// Admin routes
router.get("/", authenticate, authorize(["admin"]), orderController.getAllOrders)
router.get("/:id", authenticate, authorize(["admin"]), orderController.getOrderById)
router.put("/:id/status", authenticate, authorize(["admin"]), orderController.updateOrderStatus)
router.put('/:id', authenticate, authorize(['admin']), orderController.updateOrder)

module.exports = router
