const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const { connectToDatabase } = require("./config/database")
const routes = require("./routes")
const errorHandler = require("./middlewares/errorHandler")

// Load environment variables
require("dotenv").config()

// Initialize express app
const app = express()
const PORT = process.env.PORT || 5000

// Middlewares
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan("dev"))

// Routes
app.use("/api", routes)

// Error handling middleware
app.use(errorHandler)

// Connect to database and start server
connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error("Failed to connect to database:", error)
    process.exit(1)
  })
