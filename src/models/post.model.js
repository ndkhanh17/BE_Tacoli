const { getDb } = require("../config/database")
const { ObjectId } = require("mongodb")

/**
 * Post Schema
 * {
 *   _id: ObjectId,
 *   title: String,
 *   content: String,
 *   summary: String,
 *   author: {
 *     _id: ObjectId,
 *     name: String
 *   },
 *   imageUrl: String,
 *   tags: [String],
 *   isPublished: Boolean,
 *   viewCount: Number,
 *   createdAt: Date,
 *   updatedAt: Date,
 *   publishedAt: Date
 * }
 */

/**
 * Create a new post
 */
exports.createPost = async (postData) => {
  const db = getDb()

  const newPost = {
    title: postData.title,
    content: postData.content,
    summary: postData.summary || "",
    author: postData.author,
    imageUrl: postData.imageUrl || "",
    tags: postData.tags || [],
    isPublished: postData.isPublished !== undefined ? postData.isPublished : false,
    viewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: postData.isPublished ? new Date() : null,
  }

  const result = await db.collection("posts").insertOne(newPost)

  return {
    _id: result.insertedId,
    ...newPost,
  }
}

/**
 * Find post by ID
 */
exports.findById = async (id) => {
  const db = getDb()
  return await db.collection("posts").findOne({ _id: new ObjectId(id) })
}

/**
 * Update post
 */
exports.updatePost = async (id, updateData) => {
  const db = getDb()

  // If post is being published now, set publishedAt
  if (updateData.isPublished && !(await this.findById(id)).isPublished) {
    updateData.publishedAt = new Date()
  }

  const result = await db.collection("posts").findOneAndUpdate(
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
 * Delete post
 */
exports.deletePost = async (id) => {
  const db = getDb()
  const result = await db.collection("posts").deleteOne({ _id: new ObjectId(id) })
  return result.deletedCount > 0
}

/**
 * Find all posts
 */
exports.findAll = async (filter = {}, options = {}) => {
  const db = getDb()

  const { limit = 0, skip = 0, sort = { createdAt: -1 } } = options

  return await db.collection("posts").find(filter).sort(sort).skip(skip).limit(limit).toArray()
}

/**
 * Count posts
 */
exports.countPosts = async (filter = {}) => {
  const db = getDb()
  return await db.collection("posts").countDocuments(filter)
}

/**
 * Increment view count
 */
exports.incrementViewCount = async (id) => {
  const db = getDb()

  const result = await db.collection("posts").findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $inc: { viewCount: 1 },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: "after" },
  )

  return result
}
