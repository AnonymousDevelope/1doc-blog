const mongoose = require("mongoose");
const UserScheme = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "superadmin"], default: "admin" }, // Multi-admin roles
});

module.exports = mongoose.model("User", UserScheme);
