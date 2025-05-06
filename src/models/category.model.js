const { getDb } = require("../config/database")
const { ObjectId } = require("mongodb")

/**
 * Category Schema
 * {
 *   _id: ObjectId,
 *   name: String,
 *   description: String,
 *   imageUrl: String,
 *   isActive: Boolean,
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 */

/**
 * Create a new category
 */
exports.createCategory = async (categoryData) => {
  const db = getDb()

  const newCategory = {
    name: categoryData.name,
    description: categoryData.description || "",
    imageUrl: categoryData.imageUrl || "",
    isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection("categories").insertOne(newCategory)

  return {
    _id: result.insertedId,
    ...newCategory,
  }
}

/**
 * Find category by ID
 */
exports.findById = async (id) => {
  const db = getDb()
  return await db.collection("categories").findOne({ _id: new ObjectId(id) })
}

/**
 * Find category by name
 */
exports.findByName = async (name) => {
  const db = getDb()
  return await db.collection("categories").findOne({ name })
}

/**
 * Update category
 */
exports.updateCategory = async (id, updateData) => {
  const db = getDb()

  const result = await db.collection("categories").findOneAndUpdate(
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
 * Delete category
 */
exports.deleteCategory = async (id) => {
  const db = getDb()
  const result = await db.collection("categories").deleteOne({ _id: new ObjectId(id) })
  return result.deletedCount > 0
}

/**
 * Find all categories
 */
exports.findAll = async (filter = {}) => {
  const db = getDb()
  return await db.collection("categories").find(filter).toArray()
}
