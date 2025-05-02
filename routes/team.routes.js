const express = require("express");
const router = express.Router();
const {getTeams,addTeamMember} = require("../controllers/team.controller");
const { protect } = require("../middlewares/auth.middleware");
const upload  = require("../utils/multer.config");
router.get("/", getTeams);
router.post("/",protect,upload.single("image"),addTeamMember)
module.exports = router;