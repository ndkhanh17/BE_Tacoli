const { getDb } = require("../config/database")
const { ObjectId } = require("mongodb")

/**
 * Order Schema
 * {
 *   _id: ObjectId,
 *   userId: ObjectId,
 *   items: [
 *     {
 *       productId: ObjectId,
 *       name: String,
 *       price: Number,
 *       quantity: Number,
 *       total: Number
 *     }
 *   ],
 *   totalAmount: Number,
 *   shippingAddress: {
 *     name: String,
 *     phone: String,
 *     address: String,
 *     city: String,
 *     postalCode: String
 *   },
 *   paymentMethod: String,
 *   paymentStatus: String (enum: ['pending', 'paid', 'failed']),
 *   status: String (enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 */

/**
 * Create a new order
 */
exports.createOrder = async (orderData) => {
  const db = getDb()

  const newOrder = {
    userId: new ObjectId(orderData.userId),
    items: orderData.items,
    totalAmount: orderData.totalAmount,
    shippingAddress: orderData.shippingAddress,
    paymentMethod: orderData.paymentMethod,
    paymentStatus: orderData.paymentStatus || "pending",
    status: orderData.status || "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection("orders").insertOne(newOrder)

  return {
    _id: result.insertedId,
    ...newOrder,
  }
}

/**
 * Find order by ID
 */
exports.findById = async (id) => {
  const db = getDb()
  return await db.collection("orders").findOne({ _id: new ObjectId(id) })
}

/**
 * Update order
 */
exports.updateOrder = async (id, updateData) => {
  const db = getDb()

  const result = await db.collection("orders").findOneAndUpdate(
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
 * Delete order
 */
exports.deleteOrder = async (id) => {
  const db = getDb()
  const result = await db.collection("orders").deleteOne({ _id: new ObjectId(id) })
  return result.deletedCount > 0
}

/**
 * Find all orders
 */
exports.findAll = async (filter = {}, options = {}) => {
  const db = getDb()

  const { limit = 0, skip = 0, sort = { createdAt: -1 } } = options

  return await db.collection("orders").find(filter).sort(sort).skip(skip).limit(limit).toArray()
}

/**
 * Count orders
 */
exports.countOrders = async (filter = {}) => {
  const db = getDb()
  return await db.collection("orders").countDocuments(filter)
}

/**
 * Update order status
 */
exports.updateStatus = async (id, status) => {
  const db = getDb()

  const result = await db.collection("orders").findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        status,
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
exports.updatePaymentStatus = async (id, paymentStatus) => {
  const db = getDb()

  const result = await db.collection("orders").findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        paymentStatus,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  )

  return result
}
