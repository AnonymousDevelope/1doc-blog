const Blog = require("../models/Blog");
const { uploadImage, deleteImage } = require("../utils/cloudinaryService");
const fs = require("fs");

//get all blogs
exports.getBlogs = async (req, res) => {
  try {
    const locale = req.query.locale || ""; // Default to empty string if locale is not provided
    const page = parseInt(req.query.page) || 1; // Page number (default: 1)
    const limit = parseInt(req.query.limit) || 10; // Blogs per page (default: 10)
    const skip = (page - 1) * limit; // Calculate how many blogs to skip

    // Get total number of blogs
    const total = await Blog.countDocuments();

    // Fetch blogs with pagination, populate author and comments
    const blogs = await Blog.find()
      .skip(skip)
      .limit(limit)
      .populate("author", "name email") // Only fetch name and email for author
      .populate("comments.user", "name") // Only fetch name for comment user
      .sort({ publishedAt: -1 }); // Sort by newest first

    // Transform blogs based on locale
    const transformedBlogs = blogs.map((blog) => {
      const baseBlog = {
        id: blog._id.toString(),
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
      };

      // If locale is provided, return only the localized title and content
      if (locale) {
        return {
          ...baseBlog,
          title: blog.translations[locale]?.title || blog.translations["uz"]?.title || "",
          content: blog.translations[locale]?.content || blog.translations["uz"]?.content || "",
        };
      }

      // If no locale is provided, return the full translations object
      return {
        ...baseBlog,
        translations: blog.translations,
      };
    });

    // Send response in the format expected by the frontend
    res.status(200).json({
      blogs: transformedBlogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// ✅ Create Blog (Only Admins)
exports.addBlog = async (req, res) => {
  try {
    let { translations, categories } = req.body;

    // Log the raw fields for debugging
    console.log("Received fields:", req.body);
    console.log("Received files:", req.file);

    // `translations`ni text sifatida qabul qilib, JSON'ga aylantirish
    if (typeof translations === "string") {
      try {
        translations = JSON.parse(translations);
      } catch (err) {
        return res.status(400).json({
          message: "Invalid translations format. Must be valid JSON.",
          error: err.message,
        });
      }
    }

    // `translations` ob'ekti ekanligini tekshirish
    if (!translations || typeof translations !== "object") {
      return res.status(400).json({ message: "Translations object is required" });
    }

    // Har bir til uchun title va content mavjudligini tekshirish
    const supportedLocales = ["uz", "ru", "uz-kr", "qq", "en"];
    for (const locale of supportedLocales) {
      if (!translations[locale]?.title || !translations[locale]?.content) {
        return res.status(400).json({
          message: `Title and content are required for locale: ${locale}`,
        });
      }
    }

    // Rasmni Cloudinary'ga yuklash
    let imageData = { url: "", publicId: "" };
    if (req.file) {
      try {
        console.log("Uploading image to Cloudinary:", req.file);
        imageData = await uploadImage(req.file, "blogs");
        console.log("Cloudinary response:", imageData);

        if (!imageData.url || !imageData.publicId) {
          throw new Error("Cloudinary upload failed: Invalid response (missing URL or publicId)");
        }

        // Vaqtincha saqlangan faylni o'chirish
        console.log("Deleting temporary file:", req.file.path);
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error("Error uploading image to Cloudinary:", uploadError);
        return res.status(500).json({
          message: "Failed to upload image to Cloudinary",
          error: uploadError.message,
        });
      }
    }

    const newBlog = new Blog({
      translations,
      image: imageData.url, // Cloudinary URL'i
      imagePublicId: imageData.publicId, // Cloudinary publicId (o'chirish uchun kerak)
      author: req.user._id,
      categories: categories ? categories.split(",") : [],
    });

    await newBlog.save();
    res.status(201).json(newBlog);
  } catch (err) {
    // Agar xato yuz bersa, vaqtincha faylni o'chirish
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (deleteError) {
        console.error("Error deleting temporary file:", deleteError);
      }
    }
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get Single Blog by ID
exports.getBlogById = async (req, res) => {
  try {
    const locale = req.query.locale;
    const blog = await Blog.findById(req.params.id).populate(
      "author",
      "name email",
    );
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    // 🔼 Ko'rish sonini oshirish
    blog.views += 1;
    await blog.save();

    // ✨ Agar locale bo'lsa faqat tanlangan til, bo'lmasa barcha tarjimalar
    const localizedBlog = {
      id: blog._id,
      title: locale
        ? blog.translations[locale]?.title || blog.translations["uz"].title
        : blog.translations, // to'liq object
      content: locale
        ? blog.translations[locale]?.content || blog.translations["uz"].content
        : blog.translations, // to'liq object
      image: blog.image,
      readTime: blog.readTime,
      views: blog.views,
      author: blog.author,
      categories: blog.categories,
      comments: blog.comments,
      publishedAt: blog.publishedAt,
    };

    res.json(localizedBlog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Edit Blog (Only the Author Can Edit)
exports.editBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (blog.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this post" });
    }

    // Yangilangan ma'lumotlarni qabul qilish
    let { translations, categories, image } = req.body;

    // `translations`ni text sifatida qabul qilib, JSON'ga aylantirish
    if (typeof translations === "string") {
      try {
        translations = JSON.parse(translations);
      } catch (err) {
        return res.status(400).json({
          message: "Invalid translations format. Must be valid JSON.",
          error: err.message,
        });
      }
    }

    if (translations) {
      // Har bir til uchun yangilanishlarni qo'llash
      for (const locale of ["uz", "ru", "uz-kr", "qq", "en"]) {
        if (translations[locale]) {
          blog.translations[locale] = {
            ...blog.translations[locale],
            ...translations[locale],
          };
        }
      }
    }

    if (categories) blog.categories = categories.split(",");

    // Only upload if a new file is present
    if (req.file) {
      let imageData = { url: "", publicId: "" };

      try {
        console.log("Uploading image to Cloudinary:", req.file);
        imageData = await uploadImage(req.file, "blogs");
        console.log("Cloudinary response:", imageData);

        if (!imageData.url || !imageData.publicId) {
          throw new Error("Cloudinary upload failed: Invalid response (missing URL or publicId)");
        }

        // Delete the temporarily stored file
        console.log("Deleting temporary file:", req.file.path);
        fs.unlinkSync(req.file.path);

        // Update blog image with uploaded Cloudinary URL
        blog.image = imageData.url;
        blog.imagePublicId = imageData.publicId;
      } catch (uploadError) {
        console.error("Error uploading image to Cloudinary:", uploadError);
        return res.status(500).json({
          message: "Failed to upload image to Cloudinary",
          error: uploadError.message,
        });
      }
    } else if (image) {
      blog.image = image;
    }

    await blog.save();

    res.json({ message: "Blog updated", blog });
  } catch (err) {
    // Clean up the temporary file if it exists
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (deleteError) {
        console.error("Error deleting temporary file:", deleteError);
      }
    }
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete Blog (Only the Author or Superadmin)
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (
      blog.author.toString() !== req.user._id.toString() &&
      req.user.role !== "superadmin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post" });
    }

    // Cloudinary'dan rasmni o'chirish
    if (blog.imagePublicId) {
      await deleteImage(blog.imagePublicId);
    }

    await blog.deleteOne();
    res.json({ message: "Blog deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get Blog Views by ID
exports.getBlogViews = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json({ views: blog.views });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};