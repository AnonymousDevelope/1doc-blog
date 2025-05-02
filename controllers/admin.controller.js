const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Register Admin
exports.registerAdmin = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, role });
    // Check if email already exists
    const doesExist = await User.findOne({ email });
    if (doesExist) return res.status(400).json({ message: "Bu email orqali allaqachon kirilgan" });
    await newUser.save();
    res.status(201).json({ message: "Admin Registered" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Admin
exports.deleteAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Qidirilayotgan admin topilmadi" });
    await user.deleteOne();
    res.json({ message: "Admin muvafaqiyatli o'chirildi" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Admins
exports.getAllAdmins = async (req, res) => {
  try {
    const users = await User.find({ role: "admin" }).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Admin Information
exports.updateAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Admin topilmadi !" });
    Object.assign(user, req.body);
    await user.save();
    res.json({ message: "Admin updated", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};