const { getDb } = require("../config/database")
const { ObjectId } = require("mongodb")

/**
 * Create a new order
 */
exports.createOrder = async (req, res, next) => {
  try {
    const { customerInfo, items, shippingMethod, paymentMethod, subtotal, shippingFee, total, notes } = req.body

    const db = getDb()
    const ordersCollection = db.collection("orders")
    const productsCollection = db.collection("products")

    // Validate items and check stock
    for (const item of items) {
      const product = await productsCollection.findOne({ _id: new ObjectId(item.productId) })

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.productId} not found`,
        })
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for product: ${product.name}`,
        })
      }
    }

    // Create order
    const newOrder = {
      orderNumber: `ORD-${Date.now()}`,
      customerInfo,
      items,
      shippingMethod,
      paymentMethod,
      subtotal,
      shippingFee,
      total,
      notes,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Add user ID if authenticated
    if (req.user) {
      newOrder.userId = req.user.id
    }

    const result = await ordersCollection.insertOne(newOrder)

    // Update product stock
    for (const item of items) {
      await productsCollection.updateOne({ _id: new ObjectId(item.productId) }, { $inc: { stock: -item.quantity } })
    }

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        ...newOrder,
        _id: result.insertedId,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Track order by order ID
 */
exports.trackOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params

    const db = getDb()
    const ordersCollection = db.collection("orders")

    // Find order by order number
    const order = await ordersCollection.findOne({ orderNumber: orderId })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    res.status(200).json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        shippingMethod: order.shippingMethod,
        estimatedDelivery: getEstimatedDelivery(order),
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get all orders for authenticated user
 */
exports.getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 10 } = req.query

    const db = getDb()
    const ordersCollection = db.collection("orders")

    // Calculate pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Get orders
    const orders = await ordersCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit))
      .toArray()

    // Get total count for pagination
    const total = await ordersCollection.countDocuments({ userId })

    res.status(200).json({
      success: true,
      data: {
        orders,
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
 * Get specific order for authenticated user
 */
exports.getUserOrderById = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const db = getDb()
    const ordersCollection = db.collection("orders")

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      })
    }

    // Find order
    const order = await ordersCollection.findOne({
      _id: new ObjectId(id),
      userId,
    })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    res.status(200).json({
      success: true,
      data: order,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get all orders (admin)
 */
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query

    const db = getDb()
    const ordersCollection = db.collection("orders")

    // Build query
    const query = {}

    if (status) {
      query.status = status
    }

    // Calculate pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Get orders
    const orders = await ordersCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit))
      .toArray()

    // Get total count for pagination
    const total = await ordersCollection.countDocuments(query)

    res.status(200).json({
      success: true,
      data: {
        orders,
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
 * Get order by ID (admin)
 */
exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params

    const db = getDb()
    const ordersCollection = db.collection("orders")

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      })
    }

    // Find order
    const order = await ordersCollection.findOne({ _id: new ObjectId(id) })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    res.status(200).json({
      success: true,
      data: order,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update order status (admin)
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const db = getDb()
    const ordersCollection = db.collection("orders")

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      })
    }

    // Validate status
    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      })
    }

    // Find order
    const order = await ordersCollection.findOne({ _id: new ObjectId(id) })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    // Update order status
    await ordersCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      },
    )

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Helper function to calculate estimated delivery date
 */
function getEstimatedDelivery(order) {
  const createdDate = new Date(order.createdAt)
  let daysToAdd = 0

  switch (order.shippingMethod) {
    case "express":
      daysToAdd = 2
      break
    case "standard":
    default:
      daysToAdd = 5
      break
  }

  const estimatedDate = new Date(createdDate)
  estimatedDate.setDate(createdDate.getDate() + daysToAdd)

  return estimatedDate
}
