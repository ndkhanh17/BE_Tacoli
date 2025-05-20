const bcrypt = require("bcryptjs")
const { getDb } = require("../config/database")
const { ObjectId } = require("mongodb")

/**
 * Lấy thông tin hồ sơ người dùng
 */
exports.getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id
    const db = getDb()
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      })
    }

    // Loại bỏ thông tin nhạy cảm
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
 * Cập nhật hồ sơ người dùng
 */
exports.updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { name, phone, address } = req.body
    const updateData = {}

    if (name) updateData.name = name
    if (phone) updateData.phone = phone
    if (address) updateData.address = address
    updateData.updatedAt = new Date()

    const db = getDb()
    const result = await db.collection("users").updateOne({ _id: new ObjectId(userId) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      })
    }

    const updatedUser = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    const { password, ...userWithoutPassword } = updatedUser

    res.status(200).json({
      success: true,
      message: "Cập nhật hồ sơ thành công",
      data: userWithoutPassword,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Đổi mật khẩu
 */
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Cần nhập mật khẩu hiện tại và mật khẩu mới",
      })
    }

    const db = getDb()
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      })
    }

    // Kiểm tra mật khẩu hiện tại có đúng không
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu hiện tại không đúng",
      })
    }

    // Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    // Cập nhật mật khẩu
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
      message: "Đổi mật khẩu thành công",
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Lấy danh sách tất cả người dùng (chỉ dành cho admin)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    const db = getDb()
    let query = {}

    if (search) {
      query = {
        $or: [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }],
      }
    }

    const users = await db
      .collection("users")
      .find(query)
      .skip(skip)
      .limit(Number.parseInt(limit))
      .project({ password: 0 })
      .toArray()

    const total = await db.collection("users").countDocuments(query)

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / Number.parseInt(limit)),
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Lấy thông tin người dùng theo ID (chỉ dành cho admin)
 */
exports.getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id
    const db = getDb()

    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      })
    }

    // Loại bỏ thông tin nhạy cảm
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
 * Cập nhật thông tin người dùng (chỉ dành cho admin)
 */
exports.updateUser = async (req, res, next) => {
  try {
    const userId = req.params.id
    const { name, email, phone, address, role, status } = req.body
    const updateData = {}

    if (name) updateData.name = name
    if (email) updateData.email = email
    if (phone) updateData.phone = phone
    if (address) updateData.address = address
    if (role) updateData.role = role
    if (status) updateData.status = status
    updateData.updatedAt = new Date()

    const db = getDb()
    const result = await db.collection("users").updateOne({ _id: new ObjectId(userId) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      })
    }

    const updatedUser = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    const { password, ...userWithoutPassword } = updatedUser

    res.status(200).json({
      success: true,
      message: "Cập nhật người dùng thành công",
      data: userWithoutPassword,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Xóa người dùng (chỉ dành cho admin)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id
    const db = getDb()

    const result = await db.collection("users").deleteOne({ _id: new ObjectId(userId) })

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      })
    }

    res.status(200).json({
      success: true,
      message: "Xóa người dùng thành công",
    })
  } catch (error) {
    next(error)
  }
}