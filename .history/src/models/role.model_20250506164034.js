const { getDb } = require("../config/database")
const { ObjectId } = require("mongodb")

/**
 * Role Schema
 * {
 *   _id: ObjectId,
 *   name: String,
 *   permissions: [String],
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 */

/**
 * Create a new role
 */
exports.createRole = async (roleData) => {
  const db = getDb()

  const newRole = {
    name: roleData.name,
    permissions: roleData.permissions || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection("roles").insertOne(newRole)

  return {
    _id: result.insertedId,
    ...newRole,
  }
}

/**
 * Find role by ID
 */
exports.findById = async (id) => {
  const db = getDb()
  return await db.collection("roles").findOne({ _id: new ObjectId(id) })
}

/**
 * Find role by name
 */
exports.findByName = async (name) => {
  const db = getDb()
  return await db.collection("roles").findOne({ name })
}

/**
 * Update role
 */
exports.updateRole = async (id, updateData) => {
  const db = getDb()

  const result = await db.collection("roles").findOneAndUpdate(
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
 * Delete role
 */
exports.deleteRole = async (id) => {
  const db = getDb()
  const result = await db.collection("roles").deleteOne({ _id: new ObjectId(id) })
  return result.deletedCount > 0
}

/**
 * Find all roles
 */
exports.findAll = async () => {
  const db = getDb()
  return await db.collection("roles").find({}).toArray()
}
