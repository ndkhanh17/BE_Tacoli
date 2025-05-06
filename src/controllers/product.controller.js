const { getDb } = require("../config/database")
const { ObjectId } = require("mongodb")
const productService = require("../services/product.service")

/**
 * Get all products
 */
exports.getAllProducts = async (req, res, next) => {
  try {
    const { category, status, limit = 10, page = 1 } = req.query

    const db = getDb()
    const productsCollection = db.collection("products")

    // Build query
    const query = {}

    if (category) {
      query.category = category
    }

    if (status) {
      query.status = status
    } else {
      // By default, only return active products
      query.status = "active"
    }

    // Calculate pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Get products
    const products = await productsCollection.find(query).skip(skip).limit(Number.parseInt(limit)).toArray()

    // Get total count for pagination
    const total = await productsCollection.countDocuments(query)

    res.status(200).json({
      success: true,
      data: {
        products,
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
 * Get product by ID
 */
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params

    const db = getDb()
    const productsCollection = db.collection("products")

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      })
    }

    const product = await productsCollection.findOne({ _id: new ObjectId(id) })

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      })
    }

    res.status(200).json({
      success: true,
      data: product,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get products by category
 */
exports.getProductsByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params
    const { limit = 10, page = 1 } = req.query

    const db = getDb()
    const productsCollection = db.collection("products")

    // Build query
    const query = {
      category: categoryId,
      status: "active",
    }

    // Calculate pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Get products
    const products = await productsCollection.find(query).skip(skip).limit(Number.parseInt(limit)).toArray()

    // Get total count for pagination
    const total = await productsCollection.countDocuments(query)

    res.status(200).json({
      success: true,
      data: {
        products,
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
 * Search products
 */
exports.searchProducts = async (req, res, next) => {
  try {
    const { q, category, limit = 10, page = 1 } = req.query

    const db = getDb()
    const productsCollection = db.collection("products")

    // Build query
    const query = { status: "active" }

    if (q) {
      query.$or = [{ name: { $regex: q, $options: "i" } }, { description: { $regex: q, $options: "i" } }]
    }

    if (category) {
      query.category = category
    }

    // Calculate pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Get products
    const products = await productsCollection.find(query).skip(skip).limit(Number.parseInt(limit)).toArray()

    // Get total count for pagination
    const total = await productsCollection.countDocuments(query)

    res.status(200).json({
      success: true,
      data: {
        products,
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
 * Create product
 */
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, stock, image, status = "active" } = req.body

    const db = getDb()
    const productsCollection = db.collection("products")

    // Create new product
    const newProduct = {
      name,
      description,
      price: Number.parseFloat(price),
      category,
      stock: Number.parseInt(stock),
      image,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await productsCollection.insertOne(newProduct)

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: {
        ...newProduct,
        _id: result.insertedId,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update product
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, description, price, category, stock, image, status } = req.body

    const db = getDb()
    const productsCollection = db.collection("products")

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      })
    }

    // Check if product exists
    const existingProduct = await productsCollection.findOne({ _id: new ObjectId(id) })

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      })
    }

    // Update product
    const updatedProduct = {
      name: name || existingProduct.name,
      description: description || existingProduct.description,
      price: price ? Number.parseFloat(price) : existingProduct.price,
      category: category || existingProduct.category,
      stock: stock ? Number.parseInt(stock) : existingProduct.stock,
      image: image || existingProduct.image,
      status: status || existingProduct.status,
      updatedAt: new Date(),
    }

    await productsCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedProduct })

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: {
        ...updatedProduct,
        _id: new ObjectId(id),
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete product
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params

    const db = getDb()
    const productsCollection = db.collection("products")

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      })
    }

    // Check if product exists
    const existingProduct = await productsCollection.findOne({ _id: new ObjectId(id) })

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      })
    }

    // Delete product (or set status to inactive)
    await productsCollection.deleteOne({ _id: new ObjectId(id) })

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    })
  } catch (error) {
    next(error)
  }
}
