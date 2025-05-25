const { getDb } = require("../config/database")
const { ObjectId } = require("mongodb")

/**
 * Payment Schema
 * {
 *   _id: ObjectId,
 *   orderId: ObjectId,
 *   userId: ObjectId,
 *   amount: Number,
 *   currency: String (default: 'VND'),
 *   paymentMethod: String (enum: ['cod', 'bank_transfer', 'momo', 'vnpay', 'zalopay']),
 *   paymentStatus: String (enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded']),
 *   transactionId: String,
 *   gatewayResponse: Object,
 *   paymentDate: Date,
 *   description: String,
 *   metadata: Object,
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 */

/**
 * Create a new payment
 */
exports.createPayment = async (paymentData) => {
  const db = getDb()

  const newPayment = {
    orderId: new ObjectId(paymentData.orderId),
    userId: paymentData.userId ? new ObjectId(paymentData.userId) : null,
    amount: paymentData.amount,
    currency: paymentData.currency || "VND",
    paymentMethod: paymentData.paymentMethod,
    paymentStatus: paymentData.paymentStatus || "pending",
    transactionId: paymentData.transactionId || null,
    gatewayResponse: paymentData.gatewayResponse || {},
    paymentDate: paymentData.paymentDate || null,
    description: paymentData.description || "",
    metadata: paymentData.metadata || {},
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection("payments").insertOne(newPayment)

  return {
    _id: result.insertedId,
    ...newPayment,
  }
}

/**
 * Find payment by ID
 */
exports.findById = async (id) => {
  const db = getDb()
  return await db.collection("payments").findOne({ _id: new ObjectId(id) })
}

/**
 * Find payment by order ID
 */
exports.findByOrderId = async (orderId) => {
  const db = getDb()
  return await db.collection("payments").findOne({ orderId: new ObjectId(orderId) })
}

/**
 * Find payment by transaction ID
 */
exports.findByTransactionId = async (transactionId) => {
  const db = getDb()
  return await db.collection("payments").findOne({ transactionId })
}

/**
 * Update payment
 */
exports.updatePayment = async (id, updateData) => {
  const db = getDb()

  const result = await db.collection("payments").findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...updateData,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  )

  return result
}

/**
 * Update payment status
 */
exports.updatePaymentStatus = async (id, status, gatewayResponse = {}) => {
  const db = getDb()

  const updateData = {
    paymentStatus: status,
    updatedAt: new Date(),
  }

  if (status === "completed") {
    updateData.paymentDate = new Date()
  }

  if (Object.keys(gatewayResponse).length > 0) {
    updateData.gatewayResponse = gatewayResponse
  }

  const result = await db
    .collection("payments")
    .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updateData }, { returnDocument: "after" })

  return result
}

/**
 * Find all payments
 */
exports.findAll = async (filter = {}, options = {}) => {
  const db = getDb()

  const { limit = 0, skip = 0, sort = { createdAt: -1 } } = options

  return await db.collection("payments").find(filter).sort(sort).skip(skip).limit(limit).toArray()
}

/**
 * Count payments
 */
exports.countPayments = async (filter = {}) => {
  const db = getDb()
  return await db.collection("payments").countDocuments(filter)
}

/**
 * Get payment statistics
 */
exports.getPaymentStats = async (startDate, endDate) => {
  const db = getDb()

  const matchStage = {
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  }

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: "$paymentStatus",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
      },
    },
  ]

  return await db.collection("payments").aggregate(pipeline).toArray()
}
