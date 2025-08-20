// routes/facture.routes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/facture.controller");

router.post("/generate", controller.generateInvoice);
router.get("/", controller.getAllFactures);

module.exports = router;
