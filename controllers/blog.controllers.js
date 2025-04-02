const Blog = require("../models/Blog");

exports.getBlogs = async (req, res) => {
  try {
    const locale = req.query.locale || "uz"; // Default til: uz
    const page = parseInt(req.query.page) || 1; // Sahifa raqami (default: 1)
    const limit = parseInt(req.query.limit) || 10; // Har bir sahifadagi bloglar soni (default: 10)
    const skip = (page - 1) * limit; // Qancha blog o'tkazib yuborish kerakligini hisoblash

    // Umumiy bloglar sonini olish
    const total = await Blog.countDocuments();

    // Bloglarni pagination bilan olish
    const blogs = await Blog.find()
      .skip(skip)
      .limit(limit)
      .populate("author", "name email") // Faqat name va email maydonlarini olish
      .populate("comments.user", "name") // Izoh qoldirgan foydalanuvchidan faqat name olish
      .sort({ publishedAt: -1 }); // Eng yangi bloglar birinchi

    // Bloglarni tanlangan tilga moslashtirish
    const localizedBlogs = blogs.map((blog) => ({
      id: blog._id.toString(),
      title: blog.translations[locale]?.title || blog.translations["uz"].title,
      content: blog.translations[locale]?.content || blog.translations["uz"].content,
      image: blog.image,
      readTime: blog.readTime,
      views: blog.views,
      author: {
        _id: blog.author._id.toString(),
        name: blog.author.name,
        email: blog.author.email,
      },
      categories: blog.categories,
      comments: blog.comments.map((comment) => ({
        user: {
          _id: comment.user._id.toString(),
          name: comment.user.name,
        },
        text: comment.text,
        createdAt: comment.createdAt,
      })),
      publishedAt: blog.publishedAt,
    }));

    // Response formatini frontendga moslashtirish
    res.status(200).json({
      blogs: localizedBlogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};