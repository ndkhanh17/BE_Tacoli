const { getDb } = require("../config/database")
const { ObjectId } = require("mongodb")

/**
 * Product Schema
 * {
 *   _id: ObjectId,
 *   name: String,
 *   description: String,
 *   price: Number,
 *   discountPrice: Number,
 *   category: String,
 *   imageUrl: String,
 *   stock: Number,
 *   soldCount: Number,
 *   isActive: Boolean,
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 */

/**
 * Create a new product
 */
exports.createProduct = async (productData) => {
  const db = getDb()

  const newProduct = {
    name: productData.name,
    description: productData.description || "",
    price: productData.price,
    discountPrice: productData.discountPrice || productData.price,
    category: productData.category,
    image: productData.image || "",
    stock: productData.stock || 0,
    soldCount: 0,
    isActive: productData.isActive !== undefined ? productData.isActive : true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("products").insertOne(newProduct)

  return {
    _id: result.insertedId,
    ...newProduct,
  }
}

/**
 * Find product by ID
 */
exports.findById = async (id) => {
  const db = getDb()
  return await db.collection("products").findOne({ _id: new ObjectId(id) })
}

/**
 * Update product
 */
exports.updateProduct = async (id, updateData) => {
  const db = getDb()

  const result = await db.collection("products").findOneAndUpdate(
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
 * Delete product
 */
exports.deleteProduct = async (id) => {
  const db = getDb()
  const result = await db.collection("products").deleteOne({ _id: new ObjectId(id) })
  return result.deletedCount > 0
}

/**
 * Find all products
 */
exports.findAll = async (filter = {}, options = {}) => {
  const db = getDb()

  const { limit = 0, skip = 0, sort = { createdAt: -1 } } = options

  return await db.collection("products").find(filter).sort(sort).skip(skip).limit(limit).toArray()
}

/**
 * Count products
 */
exports.countProducts = async (filter = {}) => {
  const db = getDb()
  return await db.collection("products").countDocuments(filter)
}

/**
 * Update product stock
 */
exports.updateStock = async (id, quantity) => {
  const db = getDb()

  const result = await db.collection("products").findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $inc: {
        stock: -quantity,
        soldCount: quantity,
      },
      $set: {
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  )

  return result
}
