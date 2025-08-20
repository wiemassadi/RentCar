const express = require("express");
const router = express.Router();
const utilisateurController = require("../controllers/utilisateur.controller");
const authAdmin = require("../middlewares/authAdmin");

router.get("/", utilisateurController.findAll); 
router.post("/", authAdmin, utilisateurController.create);
router.post("/:userId/fournisseurs/:fournisseurId", authAdmin, utilisateurController.addFournisseur);
router.put("/:id", authAdmin, utilisateurController.update);
router.delete("/:id", authAdmin, utilisateurController.delete);
module.exports = router;


