const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const BlogSchema = new mongoose.Schema({
  translations: {
    uz: {
      title: { type: String, required: true },
      content: { type: String, required: true },
    },
    ru: {
      title: { type: String, required: true },
      content: { type: String, required: true },
    },
    "uz-kr": {
      title: { type: String, required: true },
      content: { type: String, required: true },
    },
    qq: {
      title: { type: String, required: true },
      content: { type: String, required: true },
    },
    en: {
      title: { type: String, required: true },
      content: { type: String, required: true },
    },
  },
  image: { type: String, default: "", required: true },
  readTime: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  categories: { type: [String], required: true },
  comments: [CommentSchema], // 📝 Comments array inside each blog
  publishedAt: { type: Date, default: Date.now },
});
// Auto-calculate read time (words per minute) for each language
BlogSchema.pre("save", function (next) {
  const wordsPerMinute = 200;

  // Har bir til uchun o'qish vaqtini hisoblash
  const readTimes = {};
  for (const locale of ["uz", "ru", "uz-kr", "qq", "en"]) {
    const content = this.translations[locale]?.content || "";
    readTimes[locale] = Math.ceil(content.split(" ").length / wordsPerMinute);
  }
  // O'rtacha o'qish vaqtini saqlash (masalan, uz tilidagi vaqtni asos qilib olish)
  this.readTime = readTimes["uz"] || 0;
  next();
});

module.exports = mongoose.model("Blog", BlogSchema);