const express = require("express");
const router = express.Router();
const userAuthController = require("../../controllers/auth.controller/user");

router.post("/login", userAuthController.login);

module.exports = router;
