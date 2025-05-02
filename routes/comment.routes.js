const express = require("express");
const { protect } = require("../middlewares/auth.middleware");
const {
  addComment,
  getComments,
  editComment,
  deleteComment,
} = require("../controllers/comment.controller");
const router = express.Router();
/**
 * @desc Add a Comment to a Blog Post
 * @route POST /api/blogs/:id/comments
 * @access Private (Logged-in users)
 */
router.post("/:id/comments", protect, addComment);
/**
 * @desc Get Comments for a Blog
 * @route GET /api/blogs/:id/comments
 * @access Public
 */
router.get("/:id/comments", getComments);
/**
 * @desc Edit a Comment
 * @route PUT /api/blogs/:id/comments/:commentId
 * @access Private (Only comment owner)
 */
router.put("/:id/comments/:commentId", protect, editComment);
/**
 * @desc Delete a Comment
 * @route DELETE /api/blogs/:id/comments/:commentId
 * @access Private (Only comment owner or superadmin)
 */
router.delete("/:id/comments/:commentId", protect, deleteComment);

module.exports = router;