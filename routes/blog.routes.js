const express = require("express");
const router = express.Router();
const {
  getBlogs,
  addBlog,
  getBlogById,
  editBlog,
  deleteBlog,
  getBlogViews,
} = require("../controllers/blog.controller");
const { protect, isSuperAdmin } = require("../middlewares/auth.middleware");
const upload = require("../utils/multer.config");

// Routes
router.get("/", getBlogs); // Get all blogs with filters & pagination
router.post("/", protect, upload.single("image"), addBlog); // Create a new blog (only admins)
router.get("/:id", getBlogById); // Get a single blog by ID
router.put("/:id", protect, upload.single("image"), editBlog); // Edit a blog (only the author)
router.delete("/:id", protect, deleteBlog); // Delete a blog (only the author or superadmin)
router.get("/:id/view", getBlogViews); // Get blog views by ID

module.exports = router;