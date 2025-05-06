const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { getDb } = require("../config/database")
const { ObjectId } = require("mongodb")
const userService = require("../services/user.service")

/**
 * Register a new user
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, username, phone, password } = req.body

    const db = getDb()
    const usersCollection = db.collection("users")

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or username already exists",
      })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create new user
    const newUser = {
      name,
      email,
      username,
      phone,
      password: hashedPassword,
      role: "customer",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await usersCollection.insertOne(newUser)

    // Generate JWT token
    const token = jwt.sign({ id: result.insertedId, role: newUser.role }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "1d",
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        ...userWithoutPassword,
        _id: result.insertedId,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Login user
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    const db = getDb()
    const usersCollection = db.collection("users")

    // Find user by email
    const user = await usersCollection.findOne({ email })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // Check if user is active
    if (user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Your account is inactive. Please contact support.",
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "1d",
    })

    // Update last login
    await usersCollection.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userWithoutPassword,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Logout user
 */
exports.logout = (req, res) => {
  // Client-side should handle token removal
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  })
}

/**
 * Get current user
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    // Token verification middleware should attach user to req
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      })
    }

    const db = getDb()
    const usersCollection = db.collection("users")

    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.id) })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user

    res.status(200).json({
      success: true,
      user: userWithoutPassword,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Forgot password
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body

    // For now, just return success message
    // In a real implementation, you would:
    // 1. Verify the email exists
    // 2. Generate a reset token
    // 3. Send an email with the reset link

    res.status(200).json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Reset password
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body

    // For now, just return success message
    // In a real implementation, you would:
    // 1. Verify the token
    // 2. Update the user's password

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    })
  } catch (error) {
    next(error)
  }
}
