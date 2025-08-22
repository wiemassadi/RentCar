const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration de multer pour l'upload d'images (générique)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // if a target subfolder is specified (e.g., 'avatars'), use it
    const target = req.params?.target || req.body?.target || 'vehicles'
    const uploadPath = `uploads/${target}/`;
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Générer un nom unique pour le fichier
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = req.params?.target === 'avatars' || req.body?.target === 'avatars' ? 'avatar-' : 'image-'
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtre pour accepter seulement les images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers images sont autorisés (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB par fichier
  },
  fileFilter: fileFilter
});

// Upload multiple images pour un véhicule
exports.uploadVehicleImages = upload.array('images', 5); // Max 5 images

// Upload single avatar (user/admin/fournisseur)
exports.uploadAvatar = upload.single('avatar');

// Controller pour gérer l'upload
exports.handleVehicleImageUpload = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Aucune image uploadée' });
    }

    // Construire les URLs des images selon target
    const target = req.params?.target || req.body?.target || 'vehicles'
    const imageUrls = req.files.map(file => `/uploads/${target}/${file.filename}`)

    res.status(200).json({
      message: 'Images uploadées avec succès',
      images: imageUrls
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de l\'upload des images',
      error: error.message
    });
  }
};
// Controller pour gérer l'upload d'un avatar
exports.handleAvatarUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucune image uploadée' });
    }
    const target = 'avatars'
    const imageUrl = `/uploads/${target}/${req.file.filename}`
    res.status(200).json({ message: 'Avatar uploadé avec succès', image: imageUrl })
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'upload de l'avatar", error: error.message })
  }
}

// Supprimer une image
exports.deleteVehicleImage = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join('uploads/vehicles/', filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.status(200).json({ message: 'Image supprimée avec succès' });
    } else {
      res.status(404).json({ message: 'Image non trouvée' });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la suppression de l\'image',
      error: error.message
    });
  }
};
