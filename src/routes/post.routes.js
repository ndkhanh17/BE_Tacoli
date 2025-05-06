const express = require("express")
const router = express.Router()
const postController = require("../controllers/post.controller")
const { authenticate, authorize } = require("../middlewares/auth")
const { validatePost } = require("../validations/post.validation")

// Public routes
router.get("/", postController.getAllPosts)
router.get("/featured", postController.getFeaturedPosts)
router.get("/:id", postController.getPostById)
router.get("/category/:category", postController.getPostsByCategory)
router.get("/tag/:tag", postController.getPostsByTag)

// Admin routes
router.post("/", authenticate, authorize(["admin"]), validatePost, postController.createPost)
router.put("/:id", authenticate, authorize(["admin"]), validatePost, postController.updatePost)
router.delete("/:id", authenticate, authorize(["admin"]), postController.deletePost)

module.exports = router
