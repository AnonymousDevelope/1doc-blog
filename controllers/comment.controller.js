const Blog = require("../models/Blog");

// Add a Comment to a Blog Post
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const blog = await Blog.findById(req.params.id);

    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const newComment = { user: req.user._id, text };
    blog.comments.push(newComment);
    await blog.save();

    res.status(201).json({ message: "Comment added", comment: newComment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Comments for a Blog
exports.getComments = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("comments.user", "name email");

    if (!blog) return res.status(404).json({ message: "Blog not found" });

    res.json(blog.comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Edit a Comment
exports.editComment = async (req, res) => {
  try {
    const { text } = req.body;
    const blog = await Blog.findById(req.params.id);

    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const comment = blog.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this comment" });
    }

    comment.text = text;
    await blog.save();

    res.json({ message: "Comment updated", comment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a Comment
exports.deleteComment = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) return res.status(404).json({ message: "Blog topilmadi" });

    const comment = blog.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Komentariya topilmadi !" });

    // Check if the user is the owner of the comment or a superadmin
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Avtorizatsiyadan O'tilmagan !" });
    }

    // Correct way to remove a comment in Mongoose 6+
    blog.comments = blog.comments.filter((c) => c._id.toString() !== req.params.commentId);
    await blog.save();
    res.json({ message: "Comment muvafaqiyatli o'chirild" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};