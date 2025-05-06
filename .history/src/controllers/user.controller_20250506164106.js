const { ObjectId } = require("mongodb")
const { getDb } = require("../config/database")
const { ApiError } = require("../utils/ApiError")
const bcrypt = require("bcryptjs")

/**
 * Get user profile
 */
exports.getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id
    const db = getDb()

    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

    if (!user) {
      return next(new ApiError(404, "User not found"))
    }

    // Remove sensitive information
    const { password, ...userWithoutPassword } = user

    res.status(200).json({
      success: true,
      data: userWithoutPassword,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update user profile
 */
exports.updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id
    const db = getDb()
    const { name, phone, address } = req.body

    const updateData = {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(address && { address }),
      updatedAt: new Date(),
    }

    const result = await db
      .collection("users")
      .findOneAndUpdate({ _id: new ObjectId(userId) }, { $set: updateData }, { returnDocument: "after" })

    if (!result) {
      return next(new ApiError(404, "User not found"))
    }

    // Remove sensitive information
    const { password, ...userWithoutPassword } = result

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: userWithoutPassword,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Change user password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id
    const db = getDb()
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return next(new ApiError(400, "Current password and new password are required"))
    }

    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

    if (!user) {
      return next(new ApiError(404, "User not found"))
    }

    // Check if current password is correct
    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password)

    if (!isPasswordCorrect) {
      return next(new ApiError(400, "Current password is incorrect"))
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    // Update password
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      },
    )

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get all users (admin only)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const db = getDb()

    const users = await db.collection("users").find({}).toArray()

    // Remove passwords from response
    const usersWithoutPasswords = users.map((user) => {
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword
    })

    res.status(200).json({
      success: true,
      count: users.length,
      data: usersWithoutPasswords,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get user by ID (admin only)
 */
exports.getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id
    const db = getDb()

    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

    if (!user) {
      return next(new ApiError(404, "User not found"))
    }

    // Remove sensitive information
    const { password, ...userWithoutPassword } = user

    res.status(200).json({
      success: true,
      data: userWithoutPassword,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update user (admin only)
 */
exports.updateUser = async (req, res, next) => {
  try {
    const userId = req.params.id
    const db = getDb()
    const { name, email, phone, address, role } = req.body

    // Check if user exists
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

    if (!user) {
      return next(new ApiError(404, "User not found"))
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await db.collection("users").findOne({ email })

      if (existingUser) {
        return next(new ApiError(400, "Email is already taken"))
      }
    }

    const updateData = {
      ...(name && { name }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(address && { address }),
      ...(role && { role }),
      updatedAt: new Date(),
    }

    const result = await db
      .collection("users")
      .findOneAndUpdate({ _id: new ObjectId(userId) }, { $set: updateData }, { returnDocument: "after" })

    // Remove sensitive information
    const { password, ...userWithoutPassword } = result

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: userWithoutPassword,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete user (admin only)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id
    const db = getDb()

    // Check if user exists
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

    if (!user) {
      return next(new ApiError(404, "User not found"))
    }

    // Delete user
    await db.collection("users").deleteOne({ _id: new ObjectId(userId) })

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    next(error)
  }
}
