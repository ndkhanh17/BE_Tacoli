const { getDb } = require("../config/database")
const { ObjectId } = require("mongodb")

/**
 * Get all published posts
 */
exports.getAllPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category } = req.query

    const db = getDb()
    const postsCollection = db.collection("posts")

    // Build query
    const query = { status: "published" }

    if (category) {
      query.category = category
    }

    // Calculate pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Get posts
    const posts = await postsCollection
      .find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit))
      .toArray()

    // Get total count for pagination
    const total = await postsCollection.countDocuments(query)

    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          total,
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          pages: Math.ceil(total / Number.parseInt(limit)),
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get featured posts
 */
exports.getFeaturedPosts = async (req, res, next) => {
  try {
    const { limit = 3 } = req.query

    const db = getDb()
    const postsCollection = db.collection("posts")

    // Get featured posts
    const featuredPosts = await postsCollection
      .find({ featured: true, status: "published" })
      .sort({ date: -1 })
      .limit(Number.parseInt(limit))
      .toArray()

    res.status(200).json({
      success: true,
      data: featuredPosts,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get post by ID
 */
exports.getPostById = async (req, res, next) => {
  try {
    const { id } = req.params

    const db = getDb()
    const postsCollection = db.collection("posts")

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      })
    }

    // Find post
    const post = await postsCollection.findOne({ _id: new ObjectId(id) })

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      })
    }

    // Increment view count
    await postsCollection.updateOne({ _id: new ObjectId(id) }, { $inc: { views: 1 } })

    res.status(200).json({
      success: true,
      data: {
        ...post,
        views: post.views + 1,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get posts by category
 */
exports.getPostsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params
    const { page = 1, limit = 10 } = req.query

    const db = getDb()
    const postsCollection = db.collection("posts")

    // Build query
    const query = {
      category,
      status: "published",
    }

    // Calculate pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Get posts
    const posts = await postsCollection
      .find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit))
      .toArray()

    // Get total count for pagination
    const total = await postsCollection.countDocuments(query)

    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          total,
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          pages: Math.ceil(total / Number.parseInt(limit)),
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get posts by tag
 */
exports.getPostsByTag = async (req, res, next) => {
  try {
    const { tag } = req.params
    const { page = 1, limit = 10 } = req.query

    const db = getDb()
    const postsCollection = db.collection("posts")

    // Build query
    const query = {
      tags: tag,
      status: "published",
    }

    // Calculate pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Get posts
    const posts = await postsCollection
      .find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit))
      .toArray()

    // Get total count for pagination
    const total = await postsCollection.countDocuments(query)

    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          total,
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          pages: Math.ceil(total / Number.parseInt(limit)),
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Create post (admin)
 */
exports.createPost = async (req, res, next) => {
  try {
    const { title, excerpt, content, category, image, author, tags = [], featured = false, status = "draft" } = req.body

    const db = getDb()
    const postsCollection = db.collection("posts")

    // Create new post
    const newPost = {
      title,
      excerpt,
      content,
      category,
      image,
      author,
      tags,
      featured,
      status,
      views: 0,
      date: new Date().toISOString().split("T")[0],
      readTime: calculateReadTime(content),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await postsCollection.insertOne(newPost)

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: {
        ...newPost,
        _id: result.insertedId,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update post (admin)
 */
exports.updatePost = async (req, res, next) => {
  try {
    const { id } = req.params
    const { title, excerpt, content, category, image, author, tags, featured, status } = req.body

    const db = getDb()
    const postsCollection = db.collection("posts")

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      })
    }

    // Check if post exists
    const existingPost = await postsCollection.findOne({ _id: new ObjectId(id) })

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      })
    }

    // Update post
    const updatedPost = {
      title: title || existingPost.title,
      excerpt: excerpt || existingPost.excerpt,
      content: content || existingPost.content,
      category: category || existingPost.category,
      image: image || existingPost.image,
      author: author || existingPost.author,
      tags: tags || existingPost.tags,
      featured: featured !== undefined ? featured : existingPost.featured,
      status: status || existingPost.status,
      updatedAt: new Date(),
    }

    // Recalculate read time if content changed
    if (content && content !== existingPost.content) {
      updatedPost.readTime = calculateReadTime(content)
    }

    await postsCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedPost })

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: {
        ...existingPost,
        ...updatedPost,
        _id: new ObjectId(id),
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete post (admin)
 */
exports.deletePost = async (req, res, next) => {
  try {
    const { id } = req.params

    const db = getDb()
    const postsCollection = db.collection("posts")

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      })
    }

    // Check if post exists
    const existingPost = await postsCollection.findOne({ _id: new ObjectId(id) })

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      })
    }

    // Delete post
    await postsCollection.deleteOne({ _id: new ObjectId(id) })

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Helper function to calculate read time
 */
function calculateReadTime(content) {
  // Average reading speed: 200 words per minute
  const wordCount = content.trim().split(/\s+/).length
  const readTimeMinutes = Math.ceil(wordCount / 200)

  return `${readTimeMinutes} phút đọc`
}
