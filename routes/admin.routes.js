const express = require("express");
const { protect, isSuperAdmin } = require("../middlewares/auth.middleware");
const {
  registerAdmin,
  deleteAdmin,
  getAllAdmins,
  updateAdmin,
} = require("../controllers/admin.controller");
const router = express.Router();
// Register a new admin
router.post("/register", protect, isSuperAdmin, registerAdmin);
// Delete an admin by ID
router.delete("/:id", protect, isSuperAdmin, deleteAdmin);
// Get all admins
router.get("/", protect, isSuperAdmin, getAllAdmins);
// Update admin information by ID
router.put("/:id", protect, isSuperAdmin, updateAdmin);

module.exports = router;