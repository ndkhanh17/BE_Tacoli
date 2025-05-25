const { MongoClient } = require("mongodb")

// MongoDB connection variables
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017"
const DB_NAME = process.env.DB_NAME || "tacoli_tea_db"

let db = null

/**
 * Connect to MongoDB database
 */
async function connectToDatabase() {
  try {
    const client = new MongoClient(MONGODB_URI)
    await client.connect()

    db = client.db(DB_NAME)
    console.log("Connected to MongoDB successfully")

    // Initialize collections if needed
    await initializeCollections()

    return db
  } catch (error) {
    console.error("MongoDB connection error:", error)
    throw error
  }
}

/**
 * Initialize database collections
 */
async function initializeCollections() {
  // Create collections if they don't exist
  const collections = ["users", "products", "categories", "orders", "posts", "roles","payment",]

  for (const collectionName of collections) {
    const collectionExists = await db.listCollections({ name: collectionName }).hasNext()
    if (!collectionExists) {
      await db.createCollection(collectionName)
      console.log(`Collection '${collectionName}' created`)
    }
  }
}

/**
 * Get database instance
 */
function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call connectToDatabase first.")
  }
  return db
}

module.exports = {
  connectToDatabase,
  getDb,
}
