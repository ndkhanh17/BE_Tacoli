const { getDb } = require("../config/database")
const { ObjectId } = require("mongodb")

/**
 * Find product by ID
 */
exports.findProductById = async (productId) => {
  const db = getDb()
  const productsCollection = db.collection("products")

  return await productsCollection.findOne({ _id: new ObjectId(productId) })
}

/**
 * Create new product
 */
exports.createProduct = async (productData) => {
  const db = getDb()
  const productsCollection = db.collection("products")
  const categoriesCollection = db.collection("categories")

  const newProduct = {
    ...productData,
    price: Number.parseFloat(productData.price),
    stock: Number.parseInt(productData.stock),
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await productsCollection.insertOne(newProduct)

  // Update category product count
  await categoriesCollection.updateOne({ name: productData.category }, { $inc: { productsCount: 1 } })

  return {
    ...newProduct,
    _id: result.insertedId,
  }
}

/**
 * Update product
 */
exports.updateProduct = async (productId, updateData) => {
  const db = getDb()
  const productsCollection = db.collection("products")
  const categoriesCollection = db.collection("categories")

  // Get existing product
  const existingProduct = await this.findProductById(productId)

  if (!existingProduct) {
    throw new Error("Product not found")
  }

  // Parse numeric values
  if (updateData.price) {
    updateData.price = Number.parseFloat(updateData.price)
  }

  if (updateData.stock) {
    updateData.stock = Number.parseInt(updateData.stock)
  }

  updateData.updatedAt = new Date()

  // Update product
  await productsCollection.updateOne({ _id: new ObjectId(productId) }, { $set: updateData })

  // Update category product count if category changed
  if (updateData.category && updateData.category !== existingProduct.category) {
    // Decrement old category count
    await categoriesCollection.updateOne({ name: existingProduct.category }, { $inc: { productsCount: -1 } })

    // Increment new category count
    await categoriesCollection.updateOne({ name: updateData.category }, { $inc: { productsCount: 1 } })
  }

  return await this.findProductById(productId)
}

/**
 * Delete product
 */
exports.deleteProduct = async (productId) => {
  const db = getDb()
  const productsCollection = db.collection("products")
  const categoriesCollection = db.collection("categories")

  // Get existing product
  const existingProduct = await this.findProductById(productId)

  if (!existingProduct) {
    throw new Error("Product not found")
  }

  // Delete product
  await productsCollection.deleteOne({ _id: new ObjectId(productId) })

  // Update category product count
  await categoriesCollection.updateOne({ name: existingProduct.category }, { $inc: { productsCount: -1 } })

  return true
}

/**
 * Get all products
 */
exports.getAllProducts = async (query = {}, options = {}) => {
  const db = getDb()
  const productsCollection = db.collection("products")

  const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options

  const products = await productsCollection.find(query).sort(sort).skip(skip).limit(limit).toArray()

  const total = await productsCollection.countDocuments(query)

  return {
    products,
    pagination: {
      total,
      page: Math.floor(skip / limit) + 1,
      limit,
      pages: Math.ceil(total / limit),
    },
  }
}
