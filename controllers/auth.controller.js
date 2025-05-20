const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    console.log("Log In");
    // Tokenni cookie orqali yuborish
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS bo'lsa true
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 soat
    });
    res.json({ message: "Login successful",token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.verifyToken = (req, res, next) => {
  try {
    res.json({
      valid:true,
      message:"success verify",
      token:req.headers.authorization.split(' ').at(1)
    })                                                                     
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized, Invalid Token", valid: false });
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Logout failed" });
  }
};
