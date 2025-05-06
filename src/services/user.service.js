const { getDb } = require("../config/database")
const { ObjectId } = require("mongodb")
const bcrypt = require("bcryptjs")

/**
 * Find user by ID
 */
exports.findUserById = async (userId) => {
  const db = getDb()
  const usersCollection = db.collection("users")

  return await usersCollection.findOne({ _id: new ObjectId(userId) })
}

/**
 * Find user by email
 */
exports.findUserByEmail = async (email) => {
  const db = getDb()
  const usersCollection = db.collection("users")

  return await usersCollection.findOne({ email })
}

/**
 * Find user by username
 */
exports.findUserByUsername = async (username) => {
  const db = getDb()
  const usersCollection = db.collection("users")

  return await usersCollection.findOne({ username })
}

/**
 * Create new user
 */
exports.createUser = async (userData) => {
  const db = getDb()
  const usersCollection = db.collection("users")

  // Hash password
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(userData.password, salt)

  const newUser = {
    ...userData,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await usersCollection.insertOne(newUser)

  return {
    ...newUser,
    _id: result.insertedId,
  }
}

/**
 * Update user
 */
exports.updateUser = async (userId, updateData) => {
  const db = getDb()
  const usersCollection = db.collection("users")

  // Hash password if provided
  if (updateData.password) {
    const salt = await bcrypt.genSalt(10)
    updateData.password = await bcrypt.hash(updateData.password, salt)
  }

  updateData.updatedAt = new Date()

  await usersCollection.updateOne({ _id: new ObjectId(userId) }, { $set: updateData })

  return await this.findUserById(userId)
}

/**
 * Delete user
 */
exports.deleteUser = async (userId) => {
  const db = getDb()
  const usersCollection = db.collection("users")

  return await usersCollection.deleteOne({ _id: new ObjectId(userId) })
}

/**
 * Get all users
 */
exports.getAllUsers = async (query = {}, options = {}) => {
  const db = getDb()
  const usersCollection = db.collection("users")

  const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options

  const users = await usersCollection.find(query).sort(sort).skip(skip).limit(limit).toArray()

  const total = await usersCollection.countDocuments(query)

  return {
    users,
    pagination: {
      total,
      page: Math.floor(skip / limit) + 1,
      limit,
      pages: Math.ceil(total / limit),
    },
  }
}
