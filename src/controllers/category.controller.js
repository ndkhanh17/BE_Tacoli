const { getDb } = require("../config/database")
const { ObjectId } = require("mongodb")

/**
 * Get all categories
 */
exports.getAllCategories = async (req, res, next) => {
  try {
    const db = getDb()
    const categoriesCollection = db.collection("categories")

    const categories = await categoriesCollection.find().toArray()

    res.status(200).json({
      success: true,
      data: categories,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get category by ID
 */
exports.getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params

    const db = getDb()
    const categoriesCollection = db.collection("categories")

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      })
    }

    const category = await categoriesCollection.findOne({ _id: new ObjectId(id) })

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    res.status(200).json({
      success: true,
      data: category,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Create category
 */
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, status = "active" } = req.body

    const db = getDb()
    const categoriesCollection = db.collection("categories")

    // Check if category already exists
    const existingCategory = await categoriesCollection.findOne({ name })

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      })
    }

    // Create new category
    const newCategory = {
      name,
      description,
      status,
      productsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await categoriesCollection.insertOne(newCategory)

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: {
        ...newCategory,
        _id: result.insertedId,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update category
 */
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, description, status } = req.body

    const db = getDb()
    const categoriesCollection = db.collection("categories")

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      })
    }

    // Check if category exists
    const existingCategory = await categoriesCollection.findOne({ _id: new ObjectId(id) })

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    // Check if name is being changed and if it already exists
    if (name && name !== existingCategory.name) {
      const nameExists = await categoriesCollection.findOne({
        name,
        _id: { $ne: new ObjectId(id) },
      })

      if (nameExists) {
        return res.status(400).json({
          success: false,
          message: "Category with this name already exists",
        })
      }
    }

    // Update category
    const updatedCategory = {
      name: name || existingCategory.name,
      description: description || existingCategory.description,
      status: status || existingCategory.status,
      updatedAt: new Date(),
    }

    await categoriesCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedCategory })

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: {
        ...existingCategory,
        ...updatedCategory,
        _id: new ObjectId(id),
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete category
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params

    const db = getDb()
    const categoriesCollection = db.collection("categories")
    const productsCollection = db.collection("products")

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      })
    }

    // Check if category exists
    const existingCategory = await categoriesCollection.findOne({ _id: new ObjectId(id) })

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    // Check if category has products
    const productsCount = await productsCollection.countDocuments({ category: existingCategory.name })

    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category with associated products",
      })
    }

    // Delete category
    await categoriesCollection.deleteOne({ _id: new ObjectId(id) })

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    })
  } catch (error) {
    next(error)
  }
}
