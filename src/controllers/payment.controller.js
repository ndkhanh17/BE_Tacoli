const { getDb } = require("../config/database")
const { ObjectId } = require("mongodb")
const paymentModel = require("../models/payment.model")
const orderModel = require("../models/order.model")
const crypto = require("crypto")

/**
 * Create payment for order
 */
exports.createPayment = async (req, res, next) => {
  try {
    const { orderId, paymentMethod, returnUrl, cancelUrl } = req.body

    // Validate order exists
    const order = await orderModel.findById(orderId)
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    // Check if payment already exists for this order
    const existingPayment = await paymentModel.findByOrderId(orderId)
    if (existingPayment && existingPayment.paymentStatus !== "failed") {
      return res.status(400).json({
        success: false,
        message: "Payment already exists for this order",
      })
    }

    // Create payment record
    const paymentData = {
      orderId,
      userId: req.user?.id || null,
      amount: order.totalAmount || order.total,
      paymentMethod,
      description: `Payment for order ${order.orderNumber || order._id}`,
    }

    const payment = await paymentModel.createPayment(paymentData)

    // Handle different payment methods
    let paymentResponse = {}

    switch (paymentMethod) {
      case "cod":
        paymentResponse = await handleCODPayment(payment)
        break
      case "bank_transfer":
        paymentResponse = await handleBankTransferPayment(payment)
        break
      case "vnpay":
        paymentResponse = await handleVNPayPayment(payment, returnUrl, cancelUrl)
        break
      case "zalopay":
        paymentResponse = await handleZaloPayPayment(payment, returnUrl, cancelUrl)
        break
      default:
        return res.status(400).json({
          success: false,
          message: "Unsupported payment method",
        })
    }

    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: {
        paymentId: payment._id,
        ...paymentResponse,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Handle COD payment
 */
const handleCODPayment = async (payment) => {
  // COD doesn't require immediate processing
  await paymentModel.updatePaymentStatus(payment._id, "pending")

  return {
    paymentMethod: "cod",
    status: "pending",
    message: "Order will be paid upon delivery",
  }
}

/**
 * Handle Bank Transfer payment
 */
const handleBankTransferPayment = async (payment) => {
  const transactionId = `BT${Date.now()}`

  await paymentModel.updatePayment(payment._id, {
    transactionId,
    paymentStatus: "pending",
  })

  return {
    paymentMethod: "bank_transfer",
    status: "pending",
    transactionId,
    bankInfo: {
      bankName: "Vietcombank",
      accountNumber: "1234567890",
      accountName: "TACOLI TEA COMPANY",
      transferContent: `TACOLI ${payment._id}`,
    },
    message: "Please transfer money to the provided bank account",
  }
}

/**
 * Handle VNPay payment
 */
const handleVNPayPayment = async (payment, returnUrl, cancelUrl) => {
  try {
    // VNPay configuration (replace with your actual credentials)
    const vnp_TmnCode = process.env.VNPAY_TMN_CODE || "VNPAY_TMN_CODE"
    const vnp_HashSecret = process.env.VNPAY_HASH_SECRET || "VNPAY_HASH_SECRET"
    const vnp_Url = process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
    const vnp_ReturnUrl = returnUrl || `${process.env.CLIENT_URL}/payment/success`

    const date = new Date()
    const createDate = date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z/, "")
    const orderId = payment._id.toString()

    let vnp_Params = {}
    vnp_Params["vnp_Version"] = "2.1.0"
    vnp_Params["vnp_Command"] = "pay"
    vnp_Params["vnp_TmnCode"] = vnp_TmnCode
    vnp_Params["vnp_Locale"] = "vn"
    vnp_Params["vnp_CurrCode"] = "VND"
    vnp_Params["vnp_TxnRef"] = orderId
    vnp_Params["vnp_OrderInfo"] = payment.description
    vnp_Params["vnp_OrderType"] = "other"
    vnp_Params["vnp_Amount"] = payment.amount * 100 // VNPay requires amount in smallest currency unit
    vnp_Params["vnp_ReturnUrl"] = vnp_ReturnUrl
    vnp_Params["vnp_IpAddr"] = "127.0.0.1"
    vnp_Params["vnp_CreateDate"] = createDate

    // Sort parameters
    vnp_Params = sortObject(vnp_Params)

    // Create signature
    const signData = new URLSearchParams(vnp_Params).toString()
    const hmac = crypto.createHmac("sha512", vnp_HashSecret)
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex")
    vnp_Params["vnp_SecureHash"] = signed

    // Create payment URL
    const payUrl = vnp_Url + "?" + new URLSearchParams(vnp_Params).toString()

    // Update payment with transaction ID
    await paymentModel.updatePayment(payment._id, {
      transactionId: orderId,
      paymentStatus: "processing",
      gatewayResponse: { vnp_Params },
    })

    return {
      paymentMethod: "vnpay",
      status: "processing",
      payUrl,
      transactionId: orderId,
      message: "Redirect to VNPay for payment",
    }
  } catch (error) {
    console.error("VNPay payment error:", error)
    await paymentModel.updatePaymentStatus(payment._id, "failed")
    throw error
  }
}

/**
 * Handle ZaloPay payment
 */
const handleZaloPayPayment = async (payment, returnUrl, cancelUrl) => {
  try {
    // ZaloPay configuration (replace with your actual credentials)
    const app_id = process.env.ZALOPAY_APP_ID || "2553"
    const key1 = process.env.ZALOPAY_KEY1 || "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL"
    const endpoint = process.env.ZALOPAY_ENDPOINT || "https://sb-openapi.zalopay.vn/v2/create"

    const embed_data = JSON.stringify({
      redirecturl: returnUrl || `${process.env.CLIENT_URL}/payment/success`,
    })

    const items = JSON.stringify([
      {
        itemid: payment.orderId.toString(),
        itemname: payment.description,
        itemprice: payment.amount,
        itemquantity: 1,
      },
    ])

    const transID = Math.floor(Math.random() * 1000000)
    const order = {
      app_id: app_id,
      app_trans_id: `${new Date().toISOString().slice(0, 10).replace(/-/g, "")}_${transID}`,
      app_user: "user123",
      app_time: Date.now(),
      item: items,
      embed_data: embed_data,
      amount: payment.amount,
      description: payment.description,
      bank_code: "",
      callback_url: `${process.env.API_URL}/api/payments/zalopay/callback`,
    }

    // Create signature
    const data = `${app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`
    order.mac = crypto.createHmac("sha256", key1).update(data).digest("hex")

    // In a real implementation, you would make an HTTP request to ZaloPay API
    // For demo purposes, we'll simulate the response
    const zaloResponse = {
      return_code: 1,
      return_message: "success",
      sub_return_code: 1,
      sub_return_message: "",
      order_url: `https://sb-openapi.zalopay.vn/v2/gateway?order=${Buffer.from(JSON.stringify(order)).toString("base64")}`,
      zp_trans_token: `${order.app_trans_id}_token`,
      order_token: order.app_trans_id,
      qr_code: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    }

    // Update payment with transaction ID
    await paymentModel.updatePayment(payment._id, {
      transactionId: order.app_trans_id,
      paymentStatus: "processing",
      gatewayResponse: zaloResponse,
    })

    return {
      paymentMethod: "zalopay",
      status: "processing",
      payUrl: zaloResponse.order_url,
      transactionId: order.app_trans_id,
      qrCode: zaloResponse.qr_code,
      message: "Redirect to ZaloPay for payment",
    }
  } catch (error) {
    console.error("ZaloPay payment error:", error)
    await paymentModel.updatePaymentStatus(payment._id, "failed")
    throw error
  }
}

/**
 * Handle payment callback from gateways
 */
exports.handlePaymentCallback = async (req, res, next) => {
  try {
    const { gateway } = req.params
    let result = {}

    switch (gateway) {
      case "vnpay":
        result = await handleVNPayCallback(req.query)
        break
      case "zalopay":
        result = await handleZaloPayCallback(req.body)
        break
      default:
        return res.status(400).json({
          success: false,
          message: "Unsupported payment gateway",
        })
    }

    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * Handle VNPay callback
 */
const handleVNPayCallback = async (data) => {
  const { vnp_TxnRef, vnp_ResponseCode, vnp_TransactionNo } = data

  const payment = await paymentModel.findById(vnp_TxnRef)
  if (!payment) {
    return { success: false, message: "Payment not found" }
  }

  if (vnp_ResponseCode === "00") {
    // Payment successful
    await paymentModel.updatePaymentStatus(vnp_TxnRef, "completed", data)
    await updateOrderPaymentStatus(payment.orderId, "paid")
  } else {
    // Payment failed
    await paymentModel.updatePaymentStatus(vnp_TxnRef, "failed", data)
  }

  return { success: true, message: "Callback processed" }
}

/**
 * Handle ZaloPay callback
 */
const handleZaloPayCallback = async (data) => {
  const { app_trans_id, status } = data

  const payment = await paymentModel.findByTransactionId(app_trans_id)
  if (!payment) {
    return { success: false, message: "Payment not found" }
  }

  if (status === 1) {
    // Payment successful
    await paymentModel.updatePaymentStatus(payment._id, "completed", data)
    await updateOrderPaymentStatus(payment.orderId, "paid")
  } else {
    // Payment failed
    await paymentModel.updatePaymentStatus(payment._id, "failed", data)
  }

  return { success: true, message: "Callback processed" }
}

/**
 * Update order payment status
 */
const updateOrderPaymentStatus = async (orderId, paymentStatus) => {
  try {
    await orderModel.updateOrder(orderId, { paymentStatus })
  } catch (error) {
    console.error("Error updating order payment status:", error)
  }
}

/**
 * Get payment by ID
 */
exports.getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      })
    }

    const payment = await paymentModel.findById(id)

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      })
    }

    res.status(200).json({
      success: true,
      data: payment,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get payments for user
 */
exports.getUserPayments = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 10 } = req.query

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    const payments = await paymentModel.findAll(
      { userId: new ObjectId(userId) },
      {
        limit: Number.parseInt(limit),
        skip,
        sort: { createdAt: -1 },
      },
    )

    const total = await paymentModel.countPayments({ userId: new ObjectId(userId) })

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          total,
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          pages: Math.ceil(total / Number.parseInt(limit)),
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get all payments (admin)
 */
exports.getAllPayments = async (req, res, next) => {
  try {
    const { status, paymentMethod, page = 1, limit = 10 } = req.query

    const filter = {}
    if (status) filter.paymentStatus = status
    if (paymentMethod) filter.paymentMethod = paymentMethod

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    const payments = await paymentModel.findAll(filter, {
      limit: Number.parseInt(limit),
      skip,
      sort: { createdAt: -1 },
    })

    const total = await paymentModel.countPayments(filter)

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          total,
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          pages: Math.ceil(total / Number.parseInt(limit)),
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Refund payment (admin)
 */
exports.refundPayment = async (req, res, next) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      })
    }

    const payment = await paymentModel.findById(id)

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      })
    }

    if (payment.paymentStatus !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Can only refund completed payments",
      })
    }

    // Update payment status to refunded
    await paymentModel.updatePayment(id, {
      paymentStatus: "refunded",
      metadata: {
        ...payment.metadata,
        refundReason: reason,
        refundDate: new Date(),
        refundBy: req.user.id,
      },
    })

    // Update order status
    await updateOrderPaymentStatus(payment.orderId, "refunded")

    res.status(200).json({
      success: true,
      message: "Payment refunded successfully",
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get payment statistics (admin)
 */
exports.getPaymentStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const end = endDate ? new Date(endDate) : new Date()

    const stats = await paymentModel.getPaymentStats(start, end)

    res.status(200).json({
      success: true,
      data: {
        stats,
        period: {
          startDate: start,
          endDate: end,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Utility function to sort object keys
 */
function sortObject(obj) {
  const sorted = {}
  const str = []
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key))
    }
  }
  str.sort()
  for (let key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+")
  }
  return sorted
}
