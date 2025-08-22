const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/upload.controller");

// Upload d'images pour véhicules
router.post("/vehicle-images", 
  uploadController.uploadVehicleImages, 
  uploadController.handleVehicleImageUpload
);

// Upload avatar (utilisateur/admin/fournisseur)
router.post("/avatars", 
  (req, res, next) => { req.params.target = 'avatars'; next(); },
  uploadController.uploadAvatar, 
  uploadController.handleAvatarUpload
);

// Supprimer une image
router.delete("/vehicle-images/:filename", uploadController.deleteVehicleImage);

module.exports = router;
