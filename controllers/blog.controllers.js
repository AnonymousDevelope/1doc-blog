const Blog = require("../models/Blog");

exports.getBlogs = async (req, res) => {
  try {
    const locale = req.query.locale || "uz"; // Default til: uz
    const blogs = await Blog.find().populate("author").populate("comments.user");
    // Bloglarni tanlangan tilga moslashtirish
    const localizedBlogs = blogs.map((blog) => ({
      id: blog._id,
      title: blog.translations[locale]?.title || blog.translations["uz"].title,
      content: blog.translations[locale]?.content || blog.translations["uz"].content,
      image: blog.image,
      readTime: blog.readTime,
      views: blog.views,
      author: blog.author,
      categories: blog.categories,
      comments: blog.comments,
      publishedAt: blog.publishedAt,
    }));

    res.status(200).json(localizedBlogs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};