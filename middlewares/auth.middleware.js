const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      next();
    } catch (error) {
      res.status(401).json({ message: "Unauthorized, Invalid Token" });
    }
  } else {
    res.status(401).json({ message: "Token mavjud emas !" });
  }
};

const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    console.log(req);
    return res.status(401).json({ message: "super admin tomonda muammo bor" });
  }
  if (req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Access Denied" });
  }
  next();
};
module.exports = { protect, isSuperAdmin };
// super admin bilan muammo