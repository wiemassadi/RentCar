const db = require("../models");
const Voiture = db.voitures;
const Fournisseur = db.fournisseurs;
const Categorie = db.categories;
const Agence = db.agence;
const Admin = db.admins;
const bcrypt = require('bcrypt');
const NotificationService = require("../services/notification.service");

// Créer un véhicule en tant qu'admin
exports.createVehicle = async (req, res) => {
  try {
    const {
      marque,
      modele,
      annee,
      prixUnitaireHT,
      avecAssurance,
      places,
      carburant,
      transmission,
      matricule,
      categorieId,
      agencyId,
      fournisseurId,
      images,
      statut = "validated" // Admin peut directement valider
    } = req.body;

    // Vérifier que le fournisseur existe
    const fournisseur = await Fournisseur.findByPk(fournisseurId);
    if (!fournisseur) return res.status(404).send("Fournisseur non trouvé");

    // Vérifier que l'agence existe
    const agence = await Agence.findByPk(agencyId);
    if (!agence) return res.status(404).send("Agence non trouvée");

    // Vérifier que la catégorie existe
    const categorie = await Categorie.findByPk(categorieId);
    if (!categorie) return res.status(404).send("Catégorie non trouvée");

    // Vérifier que la voiture n'existe pas déjà par matricule
    const existing = await Voiture.findOne({ where: { matricule } });
    if (existing) return res.status(400).send("Un véhicule avec ce matricule existe déjà");

    // Création de la voiture par l'admin
    const voiture = await Voiture.create({
      marque,
      modele,
      annee,
      prixUnitaireHT,
      avecAssurance,
      places,
      carburant,
      transmission,
      statut,
      matricule,
      fournisseurId,
      categorieId,
      createurId: req.user?.id || 1, // ID de l'admin
      modificateurId: req.user?.id || 1,
      agencyId,
      images: images ? JSON.stringify(images) : null
    });

    // Récupérer le véhicule avec les relations
    const vehicleWithRelations = await Voiture.findByPk(voiture.id, {
      include: [
        { model: db.categories, attributes: ["id", "nom"] },
        { model: db.fournisseurs, as: "fournisseur", attributes: ["id", "nom", "email"] },
        { model: db.agence, as: "agency", attributes: ["id", "name", "city"] }
      ]
    });

    res.status(201).json(vehicleWithRelations);
  } catch (err) {
    console.error("Erreur création véhicule admin:", err);
    res.status(500).json({ message: err.message });
  }
};

// Récupérer tous les véhicules (pour admin)
exports.getAllVehicles = async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, marque, fournisseurId } = req.query;
    
    let whereConditions = {};
    
    if (statut) whereConditions.statut = statut;
    if (marque) whereConditions.marque = marque;
    if (fournisseurId) whereConditions.fournisseurId = fournisseurId;

    const offset = (page - 1) * limit;

    const { count, rows: vehicles } = await Voiture.findAndCountAll({
      where: whereConditions,
      include: [
        { model: db.categories, attributes: ["id", "nom"] },
        { model: db.fournisseurs, as: "fournisseur", attributes: ["id", "nom", "email"] },
        { model: db.agence, as: "agency", attributes: ["id", "name", "city"] },
        { model: db.driver, as: "driver", attributes: ["id", "firstName", "lastName"] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]]
    });

    // Parser les images JSON
    const vehiclesWithParsedImages = vehicles.map(vehicle => {
      const vehicleData = vehicle.toJSON();
      if (vehicleData.images) {
        try {
          vehicleData.images = JSON.parse(vehicleData.images);
        } catch (e) {
          vehicleData.images = [];
        }
      } else {
        vehicleData.images = [];
      }
      return vehicleData;
    });

    res.status(200).json({
      vehicles: vehiclesWithParsedImages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (err) {
    console.error("Erreur récupération véhicules:", err);
    res.status(500).json({ message: err.message });
  }
};

// Mettre à jour un véhicule (admin)
exports.updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Si des images sont fournies, les convertir en JSON
    if (updateData.images && Array.isArray(updateData.images)) {
      updateData.images = JSON.stringify(updateData.images);
    }
    
    updateData.modificateurId = req.user?.id || 1;

    const [updated] = await Voiture.update(updateData, { where: { id } });
    
    if (!updated) {
      return res.status(404).json({ message: "Véhicule non trouvé" });
    }

    // Récupérer le véhicule mis à jour avec les relations
    const updatedVehicle = await Voiture.findByPk(id, {
      include: [
        { model: db.categories, attributes: ["id", "nom"] },
        { model: db.fournisseurs, as: "fournisseur", attributes: ["id", "nom", "email"] },
        { model: db.agence, as: "agency", attributes: ["id", "name", "city"] }
      ]
    });

    // Parser les images
    const vehicleData = updatedVehicle.toJSON();
    if (vehicleData.images) {
      try {
        vehicleData.images = JSON.parse(vehicleData.images);
      } catch (e) {
        vehicleData.images = [];
      }
    } else {
      vehicleData.images = [];
    }

    res.status(200).json({
      message: "Véhicule mis à jour avec succès",
      vehicle: vehicleData
    });
  } catch (err) {
    console.error("Erreur mise à jour véhicule:", err);
    res.status(500).json({ message: err.message });
  }
};

// Supprimer un véhicule (admin)
exports.deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Voiture.destroy({ where: { id } });
    
    if (!deleted) {
      return res.status(404).json({ message: "Véhicule non trouvé" });
    }

    res.status(200).json({ message: "Véhicule supprimé avec succès" });
  } catch (err) {
    console.error("Erreur suppression véhicule:", err);
    res.status(500).json({ message: err.message });
  }
};

// Statistiques pour le dashboard admin
exports.getVehicleStats = async (req, res) => {
  try {
    const totalVehicles = await Voiture.count();
    const pendingVehicles = await Voiture.count({ where: { statut: 'pending' } });
    const validatedVehicles = await Voiture.count({ where: { statut: 'validated' } });
    const rejectedVehicles = await Voiture.count({ where: { statut: 'rejected' } });
    
    // Véhicules par fournisseur
    const vehiclesByProvider = await Voiture.findAll({
      attributes: [
        'fournisseurId',
        [db.sequelize.fn('COUNT', db.sequelize.col('Voiture.id')), 'count']
      ],
      include: [
        { 
          model: db.fournisseurs, 
          as: "fournisseur", 
          attributes: ["nom", "email"] 
        }
      ],
      group: ['fournisseurId', 'fournisseur.id'],
      order: [[db.sequelize.fn('COUNT', db.sequelize.col('Voiture.id')), 'DESC']],
      limit: 5
    });

    // Répartition par catégorie
    const vehiclesByCategory = await Voiture.findAll({
      attributes: [
        'categorieId',
        [db.sequelize.fn('COUNT', db.sequelize.col('Voiture.id')), 'count']
      ],
      include: [
        { 
          model: db.categories, 
          attributes: ["nom"] 
        }
      ],
      group: ['categorieId', 'categorie.id'],
      order: [[db.sequelize.fn('COUNT', db.sequelize.col('Voiture.id')), 'DESC']]
    });

    res.status(200).json({
      totalVehicles,
      pendingVehicles,
      validatedVehicles,
      rejectedVehicles,
      vehiclesByProvider: vehiclesByProvider.map(v => v.toJSON()),
      vehiclesByCategory: vehiclesByCategory.map(v => v.toJSON())
    });
  } catch (err) {
    console.error("Erreur statistiques véhicules:", err);
    res.status(500).json({ message: err.message });
  }
};

// Admin self profile
exports.getMyProfile = async (req, res) => {
  try {
    if (!req.admin?.id) return res.status(401).json({ message: 'Admin non authentifié' })
    const admin = await Admin.findByPk(req.admin.id)
    if (!admin) return res.status(404).json({ message: 'Admin non trouvé' })
    res.json(admin)
  } catch (e) { res.status(500).send(e.message) }
}

exports.updateMyProfile = async (req, res) => {
  try {
    if (!req.admin?.id) return res.status(401).json({ message: 'Admin non authentifié' })
    const { userName, email, gender, dateOfBirth, password, profilePicture } = req.body || {}
    const admin = await Admin.findByPk(req.admin.id)
    if (!admin) return res.status(404).json({ message: 'Admin non trouvé' })
    const payload = {}
    if (typeof userName === 'string') payload.userName = userName
    if (typeof email === 'string') payload.email = email
    if (typeof gender === 'string') payload.gender = gender
    if (typeof dateOfBirth === 'string') payload.dateOfBirth = dateOfBirth
    if (typeof profilePicture === 'string') payload.profilePicture = profilePicture
    if (typeof password === 'string' && password.trim()) {
      payload.password = await bcrypt.hash(password.trim(), 10)
    }
    await admin.update(payload)
    res.json(admin)
  } catch (e) { res.status(500).send(e.message) }
}

// Valider un véhicule
exports.validateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin.id;

    const voiture = await Voiture.findByPk(id, {
      include: [
        { model: db.fournisseurs, as: "fournisseur", attributes: ["id", "nom", "email"] }
      ]
    });

    if (!voiture) {
      return res.status(404).json({ message: "Véhicule non trouvé" });
    }

    if (voiture.statut === 'validated') {
      return res.status(400).json({ message: "Ce véhicule est déjà validé" });
    }

    // Mettre à jour le statut
    await voiture.update({
      statut: 'validated',
      modificateurId: adminId
    });

    // Notifier le fournisseur
    try {
      await NotificationService.notifyVehicleValidation(
        voiture.id, 
        voiture.fournisseurId, 
        true, 
        adminId
      );
    } catch (notificationError) {
      console.error('Erreur notification validation véhicule:', notificationError);
    }

    res.status(200).json({
      success: true,
      message: "Véhicule validé avec succès",
      voiture
    });
  } catch (err) {
    console.error("Erreur validation véhicule:", err);
    res.status(500).json({ message: err.message });
  }
};

// Rejeter un véhicule
exports.rejectVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin.id;
    const { reason } = req.body;

    const voiture = await Voiture.findByPk(id, {
      include: [
        { model: db.fournisseurs, as: "fournisseur", attributes: ["id", "nom", "email"] }
      ]
    });

    if (!voiture) {
      return res.status(404).json({ message: "Véhicule non trouvé" });
    }

    if (voiture.statut === 'rejected') {
      return res.status(400).json({ message: "Ce véhicule est déjà rejeté" });
    }

    // Mettre à jour le statut
    await voiture.update({
      statut: 'rejected',
      modificateurId: adminId
    });

    // Notifier le fournisseur
    try {
      await NotificationService.notifyVehicleValidation(
        voiture.id, 
        voiture.fournisseurId, 
        false, 
        adminId
      );
    } catch (notificationError) {
      console.error('Erreur notification rejet véhicule:', notificationError);
    }

    res.status(200).json({
      success: true,
      message: "Véhicule rejeté",
      voiture
    });
  } catch (err) {
    console.error("Erreur rejet véhicule:", err);
    res.status(500).json({ message: err.message });
  }
};
