const express = require("express");
const router = express.Router();
const fournisseurController = require("../controllers/fournisseur.controller");
const authAdmin = require("../middlewares/authAdmin");
const authFournisseur = require("../middlewares/authFournisseur");

// Protège et relie au bon admin
router.post("/", authAdmin, fournisseurController.create);
router.get("/", authAdmin, fournisseurController.findAll);
router.put("/:id", authAdmin, fournisseurController.update);
router.delete("/:id", authAdmin, fournisseurController.delete);
router.get("/:fournisseurId/utilisateurs", fournisseurController.getUtilisateurs);

// Self profile routes for provider
router.get("/me/profile", authFournisseur, fournisseurController.getMyProfile);
router.put("/me/profile", authFournisseur, fournisseurController.updateMyProfile);

module.exports = router;
