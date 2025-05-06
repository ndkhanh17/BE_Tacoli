const { getDb } = require("../config/database")
const { ObjectId } = require("mongodb")
const bcrypt = require("bcryptjs")

/**
 * User Schema
 * {
 *   _id: ObjectId,
 *   name: String,
 *   email: String,
 *   password: String,
 *   phone: String,
 *   address: String,
 *   role: String (default: 'user', enum: ['user', 'admin', 'editor']),
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 */

/**
 * Create a new user
 */
exports.createUser = async (userData) => {
  const db = getDb()

  // Hash password
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(userData.password, salt)

  const newUser = {
    name: userData.name,
    email: userData.email,
    password: hashedPassword,
    phone: userData.phone || "",
    address: userData.address || "",
    role: userData.role || "user",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection("users").insertOne(newUser)

  return {
    _id: result.insertedId,
    ...newUser,
  }
}

/**
 * Find user by ID
 */
exports.findById = async (id) => {
  const db = getDb()
  return await db.collection("users").findOne({ _id: new ObjectId(id) })
}

/**
 * Find user by email
 */
exports.findByEmail = async (email) => {
  const db = getDb()
  return await db.collection("users").findOne({ email })
}

/**
 * Update user
 */
exports.updateUser = async (id, updateData) => {
  const db = getDb()

  const result = await db.collection("users").findOneAndUpdate(
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
 * Delete user
 */
exports.deleteUser = async (id) => {
  const db = getDb()
  const result = await db.collection("users").deleteOne({ _id: new ObjectId(id) })
  return result.deletedCount > 0
}

/**
 * Find all users
 */
exports.findAll = async (filter = {}) => {
  const db = getDb()
  return await db.collection("users").find(filter).toArray()
}

/**
 * Compare password
 */
exports.comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword)
}
