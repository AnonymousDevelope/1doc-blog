const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const blogRoutes = require("./routes/blog.routes");
const authRoutes = require("./routes/auth.routes");
const commentRoutes = require("./routes/comment.routes");
const adminRoutes = require("./routes/admin.routes");
dotenv.config();
connectDB();
const app = express();
// Middleware
app.use(express.json()); // Parse JSON request body
app.use(cors()); // Enable CORS for frontend communication
app.use("/uploads", express.static("uploads")); // Serve uploaded images
// Routes
app.use("/api/blogs", blogRoutes); // Blog management
app.use("/api/auth", authRoutes); // Admin authentication
app.use("/api/blogs", commentRoutes); // Comment management
app.use("/api/admin", adminRoutes); // Admin management
// Default Route
app.get("/", (req, res) => {
  res.send("Blog API is running...");
});
// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

// Server Listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
