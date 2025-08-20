
const express = require("express");
const router = express.Router();
const driverController = require("../controllers/driver.controller");
const authFournisseur = require("../middlewares/authFournisseur");

router.use(authFournisseur);

router.post("/", driverController.createDriver);
router.get("/", driverController.getAllDrivers);
// Alias pour compatibilité frontend: retourne les drivers du fournisseur authentifié
router.get("/provider/:providerId", driverController.getAllDrivers);
router.get("/:id", driverController.getDriverById);
router.put("/:id", driverController.updateDriver);
router.delete("/:id", driverController.deleteDriver);

module.exports = router;