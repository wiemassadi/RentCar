const db = require("../models");
const { Op } = require("sequelize");
const Voiture = db.voitures;
const Fournisseur = db.fournisseurs;
const Reservation = db.reservations;
const Availability = db.availabilities;
const Agence = db.agence;
const Driver = db.driver;
// Create a new car (by provider)
exports.create = async (req, res) => {
  try {
    const { fournisseurId } = req.params;
    const {
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
      categorieId,
      agencyId,
      images,
      driverId
    } = req.body;

    // Vérifie que le fournisseur existe
    const fournisseur = await Fournisseur.findByPk(fournisseurId);
    if (!fournisseur) return res.status(404).send("Provider not found");

    // Vérifie que l’agence existe
    if (!agencyId) return res.status(400).send("agencyId is required");

    const agence = await Agence.findByPk(agencyId);
    if (!agence) return res.status(404).send("Agency not found");

    // Vérifie que l’agence appartient au fournisseur
    if (Number(agence.providerId) !== Number(fournisseur.id)) {
      return res.status(403).send("This agency does not belong to the provider");
    }

    // Vérifie que la catégorie existe
    const categorie = await db.categories.findByPk(categorieId);
    if (!categorie) return res.status(404).send("Category not found");

    // Vérifie que la voiture n'existe pas déjà par matricule
    const existing = await Voiture.findOne({ where: { matricule } });
    if (existing) return res.status(400).send("Car already exists (matricule)");

    // Si driverId fourni, vérifier qu'il appartient au même fournisseur
    let resolvedDriverId = null;
    if (driverId) {
      const driver = await Driver.findByPk(driverId);
      if (!driver) return res.status(404).send("Driver not found");
      if (driver.providerId !== fournisseur.id) {
        return res.status(403).send("Driver does not belong to this provider");
      }
      resolvedDriverId = driver.id;
    }

    // Création de la voiture
    const voiture = await Voiture.create({
      marque,
      modele,
      annee,
      prixUnitaireHT,
      avecAssurance,
      places,
      carburant,
      transmission,
      statut: statut || "pending",
      matricule,
      fournisseurId: fournisseur.id,
      categorieId,
      createurId: fournisseur.id,
      modificateurId: fournisseur.id,
      agencyId,
      images: images ? JSON.stringify(images) : null,
      driverId: resolvedDriverId || null
    });

    // Retourner l'objet avec images parsées
    const created = voiture.toJSON();
    if (created.images) {
      try {
        created.images = JSON.parse(created.images);
      } catch (e) {
        created.images = [];
      }
    } else {
      created.images = [];
    }

    res.status(201).json(created);
  } catch (err) {
    console.error('Create vehicle error:', err);
    res.status(500).json({ message: err?.message || 'Server error while creating vehicle' });
  }
};


// Validate a car (by admin)
exports.validate = async (req, res) => {
  try {
    const voiture = await Voiture.findByPk(req.params.id);
    if (!voiture) return res.status(404).send("Car not found");

    await voiture.update({
      statut: "validated",
      modificateurId: req.body.adminId
    });

    res.status(200).json({ message: "Car validated", voiture });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// Reject a car (by admin)
exports.reject = async (req, res) => {
  try {
    const voiture = await Voiture.findByPk(req.params.id);
    if (!voiture) return res.status(404).send("Car not found");

    await voiture.update({
      statut: "rejected",
      modificateurId: req.body.adminId
    });

    res.status(200).json({ message: "Car rejected", voiture });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// Find all cars by a provider
exports.findByFournisseur = async (req, res) => {
  try {
    const providerId = parseInt(req.params.fournisseurId, 10);
    const voitures = await Voiture.findAll({
      where: {
        [Op.or]: [
          { fournisseurId: providerId },
          { createurId: providerId }
        ]
      }
    });
    const vehiclesWithParsedImages = voitures.map(v => {
      const data = v.toJSON();
      if (data.images) {
        try {
          data.images = JSON.parse(data.images);
        } catch (e) {
          data.images = [];
        }
      } else {
        data.images = [];
      }
      return data;
    });
    res.status(200).json(vehiclesWithParsedImages);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// Find all cars with their category
exports.findAllWithCategorie = async (req, res) => {
  try {
    const voitures = await Voiture.findAll({
      include: [
        {
          model: db.categories,
          attributes: ["id", "nom"]
        }
      ]
    });

    console.log("voitures avec categorie:", JSON.stringify(voitures, null, 2));

    res.status(200).json(voitures);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// Update a car
exports.update = async (req, res) => {
  try {
    const voiture = await Voiture.findByPk(req.params.id);
    if (!voiture) return res.status(404).send("Car not found");

    const {
      marque,
      modele,
      annee,
      prixUnitaireHT,
      avecAssurance,
      statut,
       places,
      categorieId,
      modificateurId,
      agencyId,
      images,
      driverId
    } = req.body;

    const updateData = {};
    if (marque !== undefined) updateData.marque = marque;
    if (modele !== undefined) updateData.modele = modele;
    if (annee !== undefined) updateData.annee = annee;
    if (prixUnitaireHT !== undefined) updateData.prixUnitaireHT = prixUnitaireHT;
    if (avecAssurance !== undefined) updateData.avecAssurance = avecAssurance;
    if (statut !== undefined) updateData.statut = statut;
    if (places !== undefined) updateData.places = places;
    if (categorieId !== undefined) updateData.categorieId = categorieId;
    if (modificateurId !== undefined) updateData.modificateurId = modificateurId;
    if (agencyId !== undefined) updateData.agencyId = agencyId;
    if (images !== undefined) updateData.images = images ? JSON.stringify(images) : JSON.stringify([]);
    if (driverId !== undefined) updateData.driverId = driverId || null;

    await voiture.update(updateData);

    const updated = voiture.toJSON();
    if (updated.images) {
      try {
        updated.images = JSON.parse(updated.images);
      } catch (e) {
        updated.images = [];
      }
    } else {
      updated.images = [];
    }

    res.status(200).json({
      message: "Car updated successfully",
      voiture: updated
    });

  } catch (error) {
    res.status(500).send(error.message);
  }
};
// Delete a car by a provider 
exports.delete = async (req, res) => {
  try {
    const { fournisseurId, voitureId } = req.params;

    const voiture = await Voiture.findByPk(voitureId);
    if (!voiture) return res.status(404).send("Car not found");

    if (voiture.fournisseurId != fournisseurId) {
      return res.status(403).send("You are not authorized to delete this car");
    }

    await voiture.destroy();

    res.status(200).json({ message: "Car deleted successfully" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.searchAvailableCars = async (req, res) => {
  try {
    const {
      dateDebut,
      dateFin,
      categorieId,
      marque,
      transmission,
      places,
      fournisseurId,
      avecAssurance,
      ageMin,
      ageMax
    } = req.query;

    // Validation des dates
    if (!dateDebut || !dateFin) {
      return res.status(400).json({ message: "Start date and end date are required." });
    }

    const start = new Date(dateDebut);
    const end = new Date(dateFin);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format." });
    }

    if (end < start) {
      return res.status(400).json({ message: "End date must be the same or after start date." });
    }

    // Conditions de base : voiture validée
    let whereConditions = { statut: "validated" };

    // Ajout des filtres optionnels
    if (categorieId) whereConditions.categorieId = categorieId;
    if (marque) whereConditions.marque = marque;
    if (transmission) whereConditions.transmission = transmission;
    if (places) whereConditions.places = places;
    if (fournisseurId) whereConditions.fournisseurId = fournisseurId;
    if (avecAssurance !== undefined) whereConditions.avecAssurance = avecAssurance === "true";

    // Trouver les voitures réservées pendant la période donnée
    const reservations = await Reservation.findAll({
      where: {
        statut: { [Op.in]: ["pending", "confirmed"] },
        [Op.or]: [
          { dateDebut: { [Op.between]: [start, end] } },
          { dateFin: { [Op.between]: [start, end] } },
          {
            [Op.and]: [
              { dateDebut: { [Op.lte]: start } },
              { dateFin: { [Op.gte]: end } }
            ]
          }
        ]
      },
      attributes: ["voitureId"]
    });

    const reservedCarIds = reservations.map(r => r.voitureId);
    if (reservedCarIds.length > 0) {
      whereConditions.id = { [Op.notIn]: reservedCarIds };
    }

    // Récupération des voitures avec chauffeur
    const voitures = await Voiture.findAll({
      where: whereConditions,
      include: [
        { model: db.categories, as: "categorie", attributes: ["nom"] },
        { model: db.fournisseurs, as: "fournisseur" },
        { model: db.driver, as: "driver", attributes: ["id", "firstName", "lastName", "age"] }
      ],
      order: [["prixUnitaireHT", "ASC"]]
    });

    // Filtrage par âge uniquement si ageMin ou ageMax est défini
    let voituresFiltrees = voitures;

    if (ageMin || ageMax) {
      voituresFiltrees = voitures.filter(v => {
        const driver = v.driver;
        if (!driver || driver.age === null) return false;

        const age = driver.age;
        if (ageMin && age < parseInt(ageMin)) return false;
        if (ageMax && age > parseInt(ageMax)) return false;

        return true;
      });
    }

    res.status(200).json({
      message: voituresFiltrees.length
        ? "Available cars retrieved successfully."
        : "No available cars match the criteria.",
      data: voituresFiltrees
    });

  } catch (err) {
    console.error("Error while searching for cars:", err);
    res.status(500).json({
      message: "An error occurred while searching for available cars.",
      error: err.message
    });
  }
};

// Attach a driver to a car
exports.attachDriver = async (req, res) => {
  try {
    const { voitureId, driverId } = req.body;
    const voiture = await Voiture.findByPk(voitureId);
    if (!voiture) return res.status(404).json({ message: "Car not found" });
    const driver = await Driver.findByPk(driverId);
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    if (voiture.createurId !== driver.providerId){
      return res.status(403).json({ message: "Driver and car must belong to the same provider" });
    }
    voiture.driverId = driverId;
    await voiture.save();

    res.status(200).json({
      message: "Driver successfully attached to car",
      voiture
    });
  } catch (err) {
    console.error("Attach driver error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Admin/Fournisseur: statistiques véhicules par fournisseur
exports.statsByFournisseur = async (req, res) => {
  try {
    const { fournisseurId } = req.params;
    const providerId = parseInt(fournisseurId, 10);

    const baseWhere = {
      [Op.or]: [{ fournisseurId: providerId }, { createurId: providerId }],
    };

    const total = await Voiture.count({ where: baseWhere });
    const validated = await Voiture.count({ where: { ...baseWhere, statut: "validated" } });
    const pending = await Voiture.count({ where: { ...baseWhere, statut: "pending" } });
    const rejected = await Voiture.count({ where: { ...baseWhere, statut: "rejected" } });

    res.status(200).json({ total, validated, pending, rejected });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
