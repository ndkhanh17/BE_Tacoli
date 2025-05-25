const { ObjectId } = require("mongodb")
const { getDb } = require("../config/database")
const fs = require("fs")
const path = require("path")

/**
 * Lấy tất cả sản phẩm với các bộ lọc
 */
exports.getAllProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 9,
      search = "",
      category = "",
      minPrice = 0,
      maxPrice = Number.MAX_SAFE_INTEGER,
      sort = "createdAt",
      order = "desc",
    } = req.query

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)
    const db = getDb()

    // Xây dựng query
    const query = {}

    // Lọc theo danh mục
    if (category) {
      query.category = category
    }

    // Lọc theo khoảng giá
    query.price = {
      $gte: Number.parseInt(minPrice),
      $lte: Number.parseInt(maxPrice) || Number.MAX_SAFE_INTEGER,
    }

    // Lọc theo từ khóa tìm kiếm
    if (search) {
      query.name = { $regex: search, $options: "i" }
    }

    // Sắp xếp
    const sortOptions = {}
    sortOptions[sort] = order === "desc" ? -1 : 1

    // Thực hiện truy vấn
    const products = await db
      .collection("products")
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number.parseInt(limit))
      .toArray()

    // Đếm tổng số sản phẩm thỏa mãn điều kiện
    const total = await db.collection("products").countDocuments(query)

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / Number.parseInt(limit)),
      },
      filters: {
        category,
        priceRange: {
          min: Number.parseInt(minPrice),
          max: Number.parseInt(maxPrice) || Number.MAX_SAFE_INTEGER,
        },
        search,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Lấy danh sách các danh mục sản phẩm
 */
exports.getProductCategories = async (req, res, next) => {
  try {
    const db = getDb()

    // Lấy danh sách các danh mục duy nhất từ sản phẩm
    const categories = await db.collection("products").distinct("category")

    res.status(200).json({
      success: true,
      data: categories,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Lấy khoảng giá sản phẩm (min và max)
 */
exports.getProductPriceRange = async (req, res, next) => {
  try {
    const db = getDb()

    // Lấy sản phẩm có giá thấp nhất
    const minPriceProduct = await db
      .collection("products")
      .find({}, { projection: { price: 1 } })
      .sort({ price: 1 })
      .limit(1)
      .toArray()

    // Lấy sản phẩm có giá cao nhất
    const maxPriceProduct = await db
      .collection("products")
      .find({}, { projection: { price: 1 } })
      .sort({ price: -1 })
      .limit(1)
      .toArray()

    const minPrice = minPriceProduct.length > 0 ? minPriceProduct[0].price : 0
    const maxPrice = maxPriceProduct.length > 0 ? maxPriceProduct[0].price : 0

    res.status(200).json({
      success: true,
      data: {
        min: minPrice,
        max: maxPrice,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Lấy sản phẩm theo ID
 */
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID sản phẩm không hợp lệ",
      })
    }

    const db = getDb()
    const product = await db.collection("products").findOne({ _id: new ObjectId(id) })

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
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
 * Tạo sản phẩm mới
 */
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, discountPrice, category, image, stock, isActive = true } = req.body

    // Kiểm tra dữ liệu đầu vào
    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin: tên, giá và danh mục sản phẩm",
      })
    }

    const db = getDb()

    // Tạo sản phẩm mới
    const newProduct = {
      name,
      description: description || "",
      price: Number.parseFloat(price),
      discountPrice: discountPrice ? Number.parseFloat(discountPrice) : Number.parseFloat(price),
      category,
      image: image || "", // Lưu duy nhất 1 link ảnh
      stock: stock ? Number.parseInt(stock) : 0,
      soldCount: 0,
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("products").insertOne(newProduct)

    res.status(201).json({
      success: true,
      message: "Tạo sản phẩm thành công",
      data: {
        _id: result.insertedId,
        ...newProduct,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Cập nhật sản phẩm
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = req.body

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID sản phẩm không hợp lệ",
      })
    }

    // Xử lý dữ liệu số
    if (updateData.price) {
      updateData.price = Number.parseFloat(updateData.price)
    }

    if (updateData.discountPrice) {
      updateData.discountPrice = Number.parseFloat(updateData.discountPrice)
    }

    if (updateData.stock) {
      updateData.stock = Number.parseInt(updateData.stock)
    }

    // Thêm thời gian cập nhật
    updateData.updatedAt = new Date()

    const db = getDb()

    // Lấy thông tin sản phẩm cũ để kiểm tra hình ảnh
    const oldProduct = await db.collection("products").findOne({ _id: new ObjectId(id) })

    if (!oldProduct) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      })
    }

    const result = await db
      .collection("products")
      .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updateData }, { returnDocument: "after" })

    res.status(200).json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Xóa sản phẩm
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID sản phẩm không hợp lệ",
      })
    }

    const db = getDb()

    // Lấy thông tin sản phẩm để xóa hình ảnh
    const product = await db.collection("products").findOne({ _id: new ObjectId(id) })

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      })
    }

    // Xóa sản phẩm từ database
    const result = await db.collection("products").deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      })
    }

    res.status(200).json({
      success: true,
      message: "Xóa sản phẩm thành công",
    })
  } catch (error) {
    next(error)
  }
}
