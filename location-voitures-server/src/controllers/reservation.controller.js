const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const db = require("../models");
const Voiture = db.voitures;
const Reservation = db.reservations;
const Availability = db.availabilities;
const Utilisateur = db.utilisateurs;

const { calculerMontants } = require("../utils/finance");

// Parse incoming dates robustly to avoid timezone shifts.
// If format is YYYY-MM-DD, construct a local date (year, monthIndex, day)
function parseIncomingDate(value) {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(value);
}


exports.createReservation = async (req, res) => {
  try {
    const { voitureId, dateDebut, dateFin, heureDebut, heureFin, remise: remiseEnvoyee , returnAgencyId} = req.body;

    const dateDebutObj = parseIncomingDate(dateDebut);
    const dateFinObj = parseIncomingDate(dateFin);
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
    // If no return agency provided, default to pickup agency
    let resolvedReturnAgencyId = returnAgencyId ?? pickupAgencyId;
    const returnAgency = await db.agence.findByPk(resolvedReturnAgencyId);

    if (!returnAgency) {
      return res.status(404).json({ message: "Agence de retour introuvable." });
    }
    if (Number(returnAgency.providerId) !== Number(voiture.fournisseurId)) {
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
      returnAgencyId: resolvedReturnAgencyId

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

    // Business rule: confirmed reservations cannot be modified
    if (reservation.statut === "confirmed") {
      return res.status(400).json({ message: "Confirmed reservations cannot be modified" });
    }

    const newStart = parseIncomingDate(NewStartDate);
    const newEnd = parseIncomingDate(NewEndDate);
    if (newEnd < newStart)
      return res.status(400).json({ message: "End date must be after start date" });

    // Rule: modifications allowed only within 24h after reservation creation
    const now = new Date();
    const createdAt = reservation.dateReservation ? new Date(reservation.dateReservation) : new Date(reservation.createdAt);
    const twentyFourHoursAfterCreation = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
    if (now > twentyFourHoursAfterCreation) {
      return res.status(400).json({ message: "La modification est autorisée uniquement dans les 24h suivant la création de la réservation." });
    }

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

    // Synchroniser la facture liée si elle existe (recalculer montants et garder la référence)
    try {
      const existingInvoice = await db.factures.findOne({ where: { reservationId: reservation.id } });
      if (existingInvoice) {
        await existingInvoice.update({
          montantTotalHT: montant.montantTotalHT,
          montantTVA: montant.montantTVA,
          montantTotalTTC: montant.montantTotalTTC,
          // la date de facture peut rester la même; la période provient de la réservation
        });
      }
    } catch (e) {
      // Ne pas bloquer la réponse si la mise à jour de facture échoue
      console.error("Invoice sync failed:", e?.message || e);
    }

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

    // Allow cancelling both pending and confirmed (still enforcing 48h rule)

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

// List reservations for the authenticated user (client)
exports.getMyReservations = async (req, res) => {
  try {
    const userId = req.user.id;
    const reservations = await Reservation.findAll({
      where: { clientId: userId },
      include: [
        { model: db.voitures, as: "reservedCar", attributes: ["id", "marque", "modele", "annee", "images"] },
        { model: db.fournisseurs, as: "fournisseur", attributes: ["id", "nom"] },
        { model: db.agence, as: "pickupAgency", attributes: ["id", "name", "city"] },
        { model: db.agence, as: "returnAgency", attributes: ["id", "name", "city"] },
      ],
      order: [["id", "DESC"]]
    });
    const output = reservations.map(r => {
      const data = r.toJSON();
      if (data?.reservedCar?.images) {
        try { data.reservedCar.images = JSON.parse(data.reservedCar.images); } catch { data.reservedCar.images = []; }
      }
      return data;
    });
    res.json(output);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Get reservations for a specific provider
exports.getProviderReservations = async (req, res) => {
  try {
    const { fournisseurId } = req.params;
    const providerId = parseInt(fournisseurId, 10);

    const reservations = await Reservation.findAll({
      where: { fournisseurId: providerId },
      include: [
        {
          model: db.voitures,
          as: "reservedCar",
          attributes: ["id", "marque", "modele", "annee", "matricule", "images"]
        },
        {
          model: db.utilisateurs,
          as: "client",
          attributes: ["id", "nom", "prenom", "email"]
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
      // Order by id desc (more robust if dateReservation column doesn't exist yet)
      order: [["id", "DESC"]]
    });

    // Parse voiture images JSON before returning
    const output = reservations.map(r => {
      const data = r.toJSON();
      if (data?.reservedCar?.images) {
        try {
          data.reservedCar.images = JSON.parse(data.reservedCar.images);
        } catch (e) {
          data.reservedCar.images = [];
        }
      }
      return data;
    });

    res.status(200).json(output);
  } catch (err) {
    console.error("Error fetching provider reservations:", err);
    res.status(500).json({ message: "Error fetching reservations", error: err.message });
  }
};

// Get reservation statistics for a provider
exports.getProviderReservationStats = async (req, res) => {
  try {
    const { fournisseurId } = req.params;
    const providerId = parseInt(fournisseurId, 10);

    const stats = await Reservation.findAll({
      where: { fournisseurId: providerId },
      attributes: [
        "statut",
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"]
      ],
      group: ["statut"]
    });

    const totalReservations = await Reservation.count({
      where: { fournisseurId: providerId }
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