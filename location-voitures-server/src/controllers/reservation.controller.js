const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const db = require("../models");
const Voiture = db.voitures;
const Reservation = db.reservations;
const Availability = db.availabilities;
const Utilisateur = db.utilisateurs;

const { calculerMontants } = require("../utils/finance");


exports.createReservation = async (req, res) => {
  try {
    const { voitureId, dateDebut, dateFin, heureDebut, heureFin, remise: remiseEnvoyee , returnAgencyId} = req.body;

    const dateDebutObj = new Date(dateDebut);
    const dateFinObj = new Date(dateFin);
    if (dateFinObj < dateDebutObj) {
      return res.status(400).json({ message: "End date must be after start date" });
    }

  const voiture = await Voiture.findByPk(voitureId, {
  include: [{ model: db.agence, as: "agency" }],
});


    if (!voiture) return res.status(404).json({ message: "Car not found" });

    const fournisseurId = voiture.fournisseurId;
    const clientId = req.user.id;
    const conflit = await Reservation.findOne({
      where: {
        voitureId,
        statut: { [Op.in]: ["pending", "confirmed"] },
        dateDebut: { [Op.lte]: dateFinObj },
        dateFin: { [Op.gte]: dateDebutObj }
      }
    });
    if (conflit) return res.status(400).json({ message: "Car already booked for these dates" });

    const nbJours = Math.ceil((dateFinObj - dateDebutObj) / (1000 * 60 * 60 * 24)) + 1;
    const remise = remiseEnvoyee ?? voiture.remise ?? 0;
    const montant = calculerMontants(voiture.prixUnitaireHT, nbJours, remise);
    const manualAvailabilityConflict = await Availability.findOne({
      where: {
        voitureId,
        manuallyEditable: true,
        [Op.or]: [
          { startDate: { [Op.between]: [dateDebutObj, dateFinObj] } },
          { endDate: { [Op.between]: [dateDebutObj, dateFinObj] } },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: dateDebutObj } },
              { endDate: { [Op.gte]: dateFinObj } }
            ]
          }
        ]
      }
    });

    if (manualAvailabilityConflict) {
      return res.status(400).json({ message: "Car is marked as available manually during this period (conflict)." });
    }
    const pickupAgencyId = voiture.agencyId;
if (!pickupAgencyId) {
  return res.status(400).json({ message: "pickupAgencyId could not be determined from the car." });
}
const returnAgency = await db.agence.findByPk(returnAgencyId);

if (!returnAgency) {
  return res.status(404).json({ message: "Agence de retour introuvable." });
}
if (returnAgency.providerId !== voiture.fournisseurId) {
  return res.status(400).json({ message: "L'agence de retour doit appartenir au même fournisseur que la voiture." });
}


    const reservation = await Reservation.create({
      voitureId,
      clientId,
      fournisseurId,
      dateDebut: dateDebutObj,
      dateFin: dateFinObj,
      heureDebut,
      heureFin,
      prixUnitaireHT: voiture.prixUnitaireHT,
      ...montant,
      remise,
      reference: uuidv4(),
      pickupAgencyId,
      returnAgencyId

    });

    await Availability.create({
      voitureId,
      startDate: dateDebutObj,
      endDate: dateFinObj,
      startTime: heureDebut,
      endTime: heureFin,
      manuallyEditable: false
    });
    const facture = await db.factures.create({
      reference: uuidv4(),
      dateFacture: new Date(),
      montantTotalHT: montant.montantTotalHT,
      montantTVA: montant.montantTVA,
      montantTotalTTC: montant.montantTotalTTC,
      reservationId: reservation.id
    });

    res.status(201).json(reservation);
  } catch (err) {
    res.status(500).send(err.message);
  }

};
exports.modifyReservation = async (req, res) => {
  const { reference, email, NewStartDate, NewEndDate } = req.body;
  try {
    const reservation = await Reservation.findOne({ where: { reference } });
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    const client = await Utilisateur.findByPk(reservation.clientId);
    if (!client || client.email !== email)
      return res.status(403).json({ message: "Invalid credentials" });

    const newStart = new Date(NewStartDate);
    const newEnd = new Date(NewEndDate);
    if (newEnd < newStart)
      return res.status(400).json({ message: "End date must be after start date" });

    const now = new Date();
    const deadline = new Date(reservation.dateDebut);
    deadline.setDate(deadline.getDate() - 2);
    if (now > deadline)
      return res.status(400).json({ message: "Modifications not allowed within 48 hours of reservation start" });

    //  Vérifier les conflits avec d'autres réservations
    const conflit = await Reservation.findOne({
      where: {
        voitureId: reservation.voitureId,
        id: { [Op.ne]: reservation.id },
        statut: { [Op.in]: ["pending", "confirmed"] },
        [Op.or]: [
          {
            dateDebut: { [Op.between]: [newStart, newEnd] }
          },
          {
            dateFin: { [Op.between]: [newStart, newEnd] }
          },
          {
            [Op.and]: [
              { dateDebut: { [Op.lte]: newStart } },
              { dateFin: { [Op.gte]: newEnd } }
            ]
          }
        ]
      }
    });

    if (conflit)
      return res.status(400).json({ message: "Car already booked for these dates" });

    //  Vérifier les conflits avec disponibilités manuelles
    const dispoManuelle = await Availability.findOne({
      where: {
        voitureId: reservation.voitureId,
        manuallyEditable: true,
        [Op.or]: [
          { startDate: { [Op.between]: [newStart, newEnd] } },
          { endDate: { [Op.between]: [newStart, newEnd] } },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: newStart } },
              { endDate: { [Op.gte]: newEnd } }
            ]
          }
        ]
      }
    });

    if (dispoManuelle)
      return res.status(400).json({ message: "Car is already manually marked available for these dates" });

    const nbJours = Math.ceil((newEnd - newStart) / (1000 * 60 * 60 * 24)) + 1;
    const montant = calculerMontants(reservation.prixUnitaireHT, nbJours, reservation.remise);
    await reservation.update({
      dateDebut: newStart,
      dateFin: newEnd,
      ...montant,
      statut: reservation.statut === "cancelled" ? "pending" : reservation.statut
    });


    // Mettre à jour la disponibilité liée à cette réservation (non manuelle)
    await Availability.destroy({
      where: {
        voitureId: reservation.voitureId,
        manuallyEditable: false
      }
    });

    await Availability.create({
      voitureId: reservation.voitureId,
      startDate: newStart,
      endDate: newEnd,
      startTime: reservation.heureDebut,
      endTime: reservation.heureFin,
      manuallyEditable: false
    });

    res.status(200).json({ message: "Reservation successfully updated" });

  } catch (err) {
    res.status(500).send(err.message);
  }
};


exports.cancelReservation = async (req, res) => {
  const { reference, email } = req.body;
  try {
    const reservation = await Reservation.findOne({ where: { reference } });
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    const client = await Utilisateur.findByPk(reservation.clientId);
    if (!client || client.email !== email)
      return res.status(403).json({ message: "Invalid credentials" });

    const now = new Date();
    const deadline = new Date(reservation.dateDebut);
    deadline.setDate(deadline.getDate() - 2);
    if (now > deadline) return res.status(400).json({ message: "Cancellations not allowed within 48 hours of reservation start" });

    await reservation.update({ statut: "cancelled" });
    await Availability.destroy({
      where: {
        voitureId: reservation.voitureId,
        manuallyEditable: false
      }
    });
    res.status(200).json({ message: "Reservation successfully cancelled" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// Get reservations for a specific provider
exports.getProviderReservations = async (req, res) => {
  try {
    const { fournisseurId } = req.params;
    
    const reservations = await Reservation.findAll({
      where: { fournisseurId },
      include: [
        {
          model: db.voitures,
          as: "reservedCar",
          attributes: ["id", "marque", "modele", "annee", "matricule", "images"]
        },
        {
          model: db.utilisateurs,
          as: "client",
          attributes: ["id", "nom", "prenom", "email", "telephone"]
        },
        {
          model: db.agence,
          as: "pickupAgency",
          attributes: ["id", "name", "city", "address"]
        },
        {
          model: db.agence,
          as: "returnAgency",
          attributes: ["id", "name", "city", "address"]
        }
      ],
      order: [["dateReservation", "DESC"]]
    });

    res.status(200).json(reservations);
  } catch (err) {
    console.error("Error fetching provider reservations:", err);
    res.status(500).json({ message: "Error fetching reservations", error: err.message });
  }
};

// Get reservation statistics for a provider
exports.getProviderReservationStats = async (req, res) => {
  try {
    const { fournisseurId } = req.params;
    
    const stats = await Reservation.findAll({
      where: { fournisseurId },
      attributes: [
        "statut",
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"]
      ],
      group: ["statut"]
    });

    const totalReservations = await Reservation.count({
      where: { fournisseurId }
    });

    const pendingCount = stats.find(s => s.statut === "pending")?.dataValues?.count || 0;
    const confirmedCount = stats.find(s => s.statut === "confirmed")?.dataValues?.count || 0;
    const cancelledCount = stats.find(s => s.statut === "cancelled")?.dataValues?.count || 0;

    res.status(200).json({
      total: totalReservations,
      pending: parseInt(pendingCount),
      confirmed: parseInt(confirmedCount),
      cancelled: parseInt(cancelledCount)
    });
  } catch (err) {
    console.error("Error fetching provider reservation stats:", err);
    res.status(500).json({ message: "Error fetching reservation statistics", error: err.message });
  }
};

// Get current reservations (ongoing)
exports.getProviderCurrentReservations = async (req, res) => {
  try {
    const { fournisseurId } = req.params;
    const now = new Date();
    
    const currentReservations = await Reservation.findAll({
      where: { 
        fournisseurId,
        statut: 'confirmed',
        dateDebut: { [Op.lte]: now },
        dateFin: { [Op.gte]: now }
      },
      include: [
        {
          model: db.voitures,
          as: "reservedCar",
          attributes: ["id", "marque", "modele", "annee", "matricule", "images"]
        },
        {
          model: db.utilisateurs,
          as: "client",
          attributes: ["id", "nom", "prenom", "email", "telephone"]
        },
        {
          model: db.agence,
          as: "pickupAgency",
          attributes: ["id", "name", "city", "address"]
        },
        {
          model: db.agence,
          as: "returnAgency",
          attributes: ["id", "name", "city", "address"]
        }
      ],
      order: [["dateDebut", "ASC"]]
    });

    res.status(200).json(currentReservations);
  } catch (err) {
    console.error("Error fetching current reservations:", err);
    res.status(500).json({ message: "Error fetching current reservations", error: err.message });
  }
};

// Get future reservations
exports.getProviderFutureReservations = async (req, res) => {
  try {
    const { fournisseurId } = req.params;
    const now = new Date();
    
    const futureReservations = await Reservation.findAll({
      where: { 
        fournisseurId,
        statut: { [Op.in]: ['pending', 'confirmed'] },
        dateDebut: { [Op.gt]: now }
      },
      include: [
        {
          model: db.voitures,
          as: "reservedCar",
          attributes: ["id", "marque", "modele", "annee", "matricule", "images"]
        },
        {
          model: db.utilisateurs,
          as: "client",
          attributes: ["id", "nom", "prenom", "email", "telephone"]
        },
        {
          model: db.agence,
          as: "pickupAgency",
          attributes: ["id", "name", "city", "address"]
        },
        {
          model: db.agence,
          as: "returnAgency",
          attributes: ["id", "name", "city", "address"]
        }
      ],
      order: [["dateDebut", "ASC"]]
    });

    res.status(200).json(futureReservations);
  } catch (err) {
    console.error("Error fetching future reservations:", err);
    res.status(500).json({ message: "Error fetching future reservations", error: err.message });
  }
};

// Get vehicles currently in reservation
exports.getProviderVehiclesInReservation = async (req, res) => {
  try {
    const { fournisseurId } = req.params;
    const now = new Date();
    
    const vehiclesInReservation = await Voiture.findAll({
      where: { 
        fournisseurId 
      },
      include: [
        {
          model: db.reservations,
          where: {
            statut: 'confirmed',
            dateDebut: { [Op.lte]: now },
            dateFin: { [Op.gte]: now }
          },
          include: [
            {
              model: db.utilisateurs,
              as: "client",
              attributes: ["id", "nom", "prenom", "email", "telephone"]
            },
            {
              model: db.agence,
              as: "pickupAgency",
              attributes: ["id", "name", "city", "address"]
            },
            {
              model: db.agence,
              as: "returnAgency",
              attributes: ["id", "name", "city", "address"]
            }
          ]
        },
        { model: db.categories, attributes: ["id", "nom"] },
        { model: db.agence, as: "agency", attributes: ["id", "name", "city"] },
        { model: db.driver, as: "driver", attributes: ["id", "firstName", "lastName"] }
      ],
      order: [["createdAt", "DESC"]]
    });

    // Parse images for each vehicle
    const vehiclesWithParsedImages = vehiclesInReservation.map(vehicle => {
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

    res.status(200).json(vehiclesWithParsedImages);
  } catch (err) {
    console.error("Error fetching vehicles in reservation:", err);
    res.status(500).json({ message: "Error fetching vehicles in reservation", error: err.message });
  }
};