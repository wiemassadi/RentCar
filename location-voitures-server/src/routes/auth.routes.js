const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authAdmin = require("../middlewares/authAdmin");
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authAdmin, authController.logout);

module.exports = router;
