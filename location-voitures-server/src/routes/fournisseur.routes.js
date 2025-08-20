const express = require("express");
const router = express.Router();
const fournisseurController = require("../controllers/fournisseur.controller");

router.post("/", fournisseurController.create);
router.get("/", fournisseurController.findAll);
router.put("/:id", fournisseurController.update);
router.delete("/:id", fournisseurController.delete);
router.get("/:fournisseurId/utilisateurs", fournisseurController.getUtilisateurs);

module.exports = router;
