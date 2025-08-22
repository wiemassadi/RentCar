const express = require("express");
const router = express.Router();
const voitureController = require("../controllers/voiture.controller");
const authFournisseur = require("../middlewares/authFournisseur");

router.get("/voitures-avec-categorie", voitureController.findAllWithCategorie);
router.get("/search", voitureController.searchAvailableCars);
router.post("/attach-driver", authFournisseur, voitureController.attachDriver);
router.post("/:fournisseurId", voitureController.create);
// Put stats route before the dynamic id route to avoid matching conflicts
router.get("/:fournisseurId/stats", voitureController.statsByFournisseur);
router.get("/:fournisseurId", voitureController.findByFournisseur);

router.put("/:id/validate", voitureController.validate);
router.put("/:id/reject", voitureController.reject);
router.put("/:id", authFournisseur, voitureController.update);
router.delete("/:fournisseurId/:voitureId", authFournisseur, voitureController.delete);

module.exports = router;
