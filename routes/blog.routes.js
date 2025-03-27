const express = require("express");
const path = require("path");
const fs = require("fs"); // Fayl tizimi bilan ishlash uchun
const Blog = require("../models/Blog");
const { protect, isSuperAdmin } = require("../middlewares/auth.middleware");
const multer = require("multer");
const { uploadImage, deleteImage } = require("../utils/cloudinaryService");
const { getBlogs } = require("../controllers/blog.controllers");
const router = express.Router();

// ✅ Multer Config (Vaqtincha saqlash uchun)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads/")),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, GIF, and WEBP images are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

// ✅ Create Blog (Only Admins)
router.post("/", protect, upload.single("image"), async (req, res) => {
  try {
    let { translations, categories } = req.body;

    // `translations`ni text sifatida qabul qilib, JSON'ga aylantirish
    if (typeof translations === "string") {
      try {
        translations = JSON.parse(translations);
      } catch (err) {
        return res.status(400).json({ message: "Invalid translations format. Must be valid JSON." });
      }
    }

    // `translations` ob'ekti ekanligini tekshirish
    if (!translations || typeof translations !== "object") {
      return res.status(400).json({ message: "Translations object is required" });
    }

    // Har bir til uchun title va content mavjudligini tekshirish
    const supportedLocales = ["uz", "ru", "uz_cyrl", "qq", "en"];
    for (const locale of supportedLocales) {
      if (!translations[locale]?.title || !translations[locale]?.content) {
        return res.status(400).json({ message: `Title and content are required for locale: ${locale}` });
      }
    }

    // Rasmni Cloudinary'ga yuklash
    let imageData = { url: "", publicId: "" };
    if (req.file) {
      imageData = await uploadImage(req.file, "blogs");
      // Vaqtincha saqlangan faylni o'chirish
      fs.unlinkSync(req.file.path);
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
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get All Blogs with Filters & Pagination
router.get("/", getBlogs);

// ✅ Get Single Blog by ID
router.get("/:id", async (req, res) => {
  try {
    const locale = req.query.locale || "uz";
    const blog = await Blog.findById(req.params.id).populate("author", "name email");
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    // 🔼 Increment view count
    blog.views += 1;
    await blog.save();

    // Tanlangan tilga moslashtirish
    const localizedBlog = {
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
    };

    res.json(localizedBlog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Edit Blog (Only the Author Can Edit)
router.put("/:id", protect, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this post" });
    }

    // Yangilangan ma'lumotlarni qabul qilish
    let { translations, categories, image } = req.body;

    // `translations`ni text sifatida qabul qilib, JSON'ga aylantirish
    if (typeof translations === "string") {
      try {
        translations = JSON.parse(translations);
      } catch (err) {
        return res.status(400).json({ message: "Invalid translations format. Must be valid JSON." });
      }
    }

    if (translations) {
      // Har bir til uchun yangilanishlarni qo'llash
      for (const locale of ["uz", "ru", "uz_cyrl", "qq", "en"]) {
        if (translations[locale]) {
          blog.translations[locale] = {
            ...blog.translations[locale],
            ...translations[locale],
          };
        }
      }
    }

    if (categories) blog.categories = categories.split(",");
    if (image) blog.image = image;

    await blog.save();
    res.json({ message: "Blog updated", blog });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete Blog (Only the Author or Superadmin)
router.delete("/:id", protect, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Not authorized to delete this post" });
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
});

// ✅ Get Blog Views by ID
router.get("/:id/view", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json({ views: blog.views });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;