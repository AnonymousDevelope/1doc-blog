const express = require("express");
const {login} = require("../controllers/auth.controller")
require("dotenv").config("../.env");
const router = express.Router();

// Login Admin
router.post("/login",login);

module.exports = router;
