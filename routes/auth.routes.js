const express = require("express");
const {login,verifyToken, logout} = require("../controllers/auth.controller")
require("dotenv").config("../.env");
const router = express.Router();
// Login Admin
router.post("/login",login);
router.get("/verify",verifyToken);
router.get("/logout",logout);
module.exports = router;
