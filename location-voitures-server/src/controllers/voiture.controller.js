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

// Find all cars by a provider (with associations for UI display)
exports.findByFournisseur = async (req, res) => {
  try {
    const providerId = parseInt(req.params.fournisseurId, 10);
    const voitures = await Voiture.findAll({
      where: {
        [Op.or]: [
          { fournisseurId: providerId },
          { createurId: providerId }
        ]
      },
      include: [
        { model: db.categories, as: "categorie", attributes: ["id", "nom"] },
        { model: db.agence, as: "agency", attributes: ["id", "name", "city"] },
        { model: db.driver, as: "driver", attributes: ["id", "firstName", "lastName", "age"] }
      ],
      order: [["id", "DESC"]]
    });
    const vehiclesWithParsedImages = voitures.map(v => {
      const data = v.toJSON();
      if (data?.images) {
        try { data.images = Array.isArray(data.images) ? data.images : JSON.parse(data.images); } catch { data.images = []; }
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

// Stats by provider (counts of vehicles by status)
exports.statsByFournisseur = async (req, res) => {
  try {
    const providerId = parseInt(req.params.fournisseurId, 10);
    if (Number.isNaN(providerId)) {
      return res.status(400).json({ message: "Invalid fournisseurId" });
    }

    const baseWhere = {
      [Op.or]: [
        { fournisseurId: providerId },
        { createurId: providerId }
      ]
    };

    const [total, pending, validated, rejected] = await Promise.all([
      Voiture.count({ where: baseWhere }),
      Voiture.count({ where: { ...baseWhere, statut: "pending" } }),
      Voiture.count({ where: { ...baseWhere, statut: "validated" } }),
      Voiture.count({ where: { ...baseWhere, statut: "rejected" } })
    ]);

    return res.status(200).json({
      totalVehicles: total,
      pendingVehicles: pending,
      validatedVehicles: validated,
      rejectedVehicles: rejected
    });
  } catch (err) {
    console.error("statsByFournisseur error:", err);
    return res.status(500).json({ message: err?.message || "Server error" });
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

// Update a car (provider can edit own car; if current statut is 'rejected', set back to 'pending')
exports.update = async (req, res) => {
  try {
    const voiture = await Voiture.findByPk(req.params.id);
    if (!voiture) return res.status(404).send("Car not found");

    // Authorization: a provider can only update their own car
    // Accept if requester is the owner through fournisseurId or createurId
    if (req.user && req.user.id) {
      const requesterId = Number(req.user.id);
      const isOwner = Number(voiture.fournisseurId) === requesterId || Number(voiture.createurId) === requesterId;
      if (!isOwner) {
        return res.status(403).json({ message: "You are not authorized to update this car" });
      }
    }

    const {
      marque,
      modele,
      annee,
      prixUnitaireHT,
      avecAssurance,
      statut,
       places,
      carburant,
      transmission,
      matricule,
      remise,
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
    if (carburant !== undefined) updateData.carburant = carburant;
    if (transmission !== undefined) updateData.transmission = transmission;
    if (matricule !== undefined) updateData.matricule = matricule;
    if (remise !== undefined) updateData.remise = remise;
    if (categorieId !== undefined) updateData.categorieId = categorieId;
    if (modificateurId !== undefined) updateData.modificateurId = modificateurId;
    if (agencyId !== undefined) updateData.agencyId = agencyId;
    if (images !== undefined) {
      const normalized = Array.isArray(images) ? images.map(String) : [];
      updateData.images = JSON.stringify(normalized);
    }

    if (driverId !== undefined) {
      if (driverId === null || driverId === 0 || driverId === 'none') {
        updateData.driverId = null;
      } else {
        const driver = await Driver.findByPk(driverId);
        if (!driver) {
          return res.status(404).json({ message: 'Driver not found' });
        }
        // Ensure driver belongs to same provider as the car
        const carOwnerId = Number(voiture.fournisseurId || voiture.createurId);
        if (Number(driver.providerId) !== carOwnerId) {
          return res.status(403).json({ message: 'Driver does not belong to this provider' });
        }
        updateData.driverId = driverId;
      }
    }

    // If the car is currently rejected and provider edits it, automatically set statut to pending
    if (voiture.statut === 'rejected') {
      updateData.statut = 'pending';
    }

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

    // Normaliser sur des journées entières pour éviter les soucis de fuseau horaire
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

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

    // Trouver les voitures réservées pendant la période donnée (chevauchement)
    // Règle d'overlap: reservation.dateDebut <= end AND reservation.dateFin >= start
    const reservations = await Reservation.findAll({
      where: {
        statut: { [Op.in]: ["pending", "confirmed"] },
        dateDebut: { [Op.lte]: end },
        dateFin: { [Op.gte]: start }
      },
      attributes: ["voitureId"]
    });

    // Trouver les voitures bloquées manuellement (indisponibilités)
    const manualBlocks = await Availability.findAll({
      where: {
        manuallyEditable: true,
        startDate: { [Op.lte]: end },
        endDate: { [Op.gte]: start },
      },
      attributes: ["voitureId"],
    });

    const reservedCarIds = reservations.map(r => r.voitureId);
    const blockedCarIds = manualBlocks.map(a => a.voitureId);
    const excludedIds = Array.from(new Set([
      ...reservedCarIds,
      ...blockedCarIds,
    ]));
    if (excludedIds.length > 0) {
      whereConditions.id = { [Op.notIn]: excludedIds };
    }

    // Récupération des voitures avec chauffeur
    const voitures = await Voiture.findAll({
      where: whereConditions,
      include: [
        { model: db.categories, as: "categorie", attributes: ["nom"] },
        { model: db.fournisseurs, as: "fournisseur", attributes: ["id", "nom", "email"] },
        { model: db.agence, as: "agency", attributes: ["id", "name", "city"] },
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

    // Parse images JSON for each car to ensure frontend receives arrays
    const dataWithParsedImages = voituresFiltrees.map(v => {
      const json = v.toJSON();
      if (json.images) {
        try {
          json.images = Array.isArray(json.images) ? json.images : JSON.parse(json.images);
        } catch {
          json.images = [];
        }
      } else {
        json.images = [];
      }
      return json;
    });

    res.status(200).json({
      message: dataWithParsedImages.length
        ? "Available cars retrieved successfully."
        : "No available cars match the criteria.",
      data: dataWithParsedImages
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
