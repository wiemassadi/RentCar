const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const authAdmin = require("../middlewares/authAdmin");

// Routes pour la gestion des véhicules par l'admin
router.get("/vehicles/stats", authAdmin, adminController.getVehicleStats);
router.get("/vehicles", authAdmin, adminController.getAllVehicles);
router.post("/vehicles", authAdmin, adminController.createVehicle);
router.put("/vehicles/:id", authAdmin, adminController.updateVehicle);
router.delete("/vehicles/:id", authAdmin, adminController.deleteVehicle);

module.exports = router;
