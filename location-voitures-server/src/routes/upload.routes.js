const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/upload.controller");

// Upload d'images pour véhicules
router.post("/vehicle-images", 
  uploadController.uploadVehicleImages, 
  uploadController.handleVehicleImageUpload
);

// Supprimer une image
router.delete("/vehicle-images/:filename", uploadController.deleteVehicleImage);

module.exports = router;
