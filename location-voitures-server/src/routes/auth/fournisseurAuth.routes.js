const express = require("express");
const router = express.Router();
const fournisseurAuthController = require("../../controllers/auth.controller/fournisseur");

router.post("/login", fournisseurAuthController.login);

module.exports = router;
