const { v4: uuidv4 } = require("uuid");
const db = require("../models");
const Facture = db.factures;
const Reservation = db.reservations;
const Voiture = db.voitures;
const Utilisateur = db.utilisateurs;
const Fournisseur = db.fournisseurs;

function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

exports.generateInvoice = async (req, res) => {
  try {
    const { reservationId } = req.body;

    const reservation = await Reservation.findByPk(reservationId, {
      include: [
        { model: Voiture, as: "voiture" },
        { model: Utilisateur, as: "client" },
        { model: Fournisseur, as: "fournisseur" }
      ]
    });

    if (!reservation) {
      return res.status(404).json({ message: "Réservation non trouvée" });
    }

    // Vérifier si une facture existe déjà
    const existingFacture = await Facture.findOne({ where: { reservationId } });

    if (existingFacture) {
      return res.status(400).json({
        message: "Une facture a déjà été générée pour cette réservation.",
        facture: existingFacture
      });
    }

    const reference = uuidv4();
    const dateFacture = new Date();
    
    const { montantTotalHT, montantTVA, montantTotalTTC } = reservation;

    const dateDebut = new Date(reservation.dateDebut);
    const dateFin = new Date(reservation.dateFin);
    const dureeJours = Math.ceil((dateFin - dateDebut) / (1000 * 60 * 60 * 24)) + 1;

    const facture = await Facture.create({
      reference,
      dateFacture,
      montantTotalHT,
      montantTVA,
      montantTotalTTC,
      reservationId,
      statut: reservation.statut === 'confirmed' ? 'finale' : 'prefacture'
    });

    res.status(201).json({
      message: "Facture générée avec succès",
      facture: {
        ...facture.toJSON(),
        dateFacture: formatDate(facture.dateFacture),
        statut: facture.statut
      },
      details: {
        client: reservation.client,
        fournisseur: reservation.fournisseur,
        voiture: reservation.voiture,
        reservation: {
          dateDebut: formatDate(reservation.dateDebut),
          dateFin: formatDate(reservation.dateFin),
          dureeJours
        }
      }
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.getAllFactures = async (req, res) => {
  try {
    const factures = await Facture.findAll({
      include: [{ model: Reservation, as: "reservation" }]
    });
    res.status(200).json(factures);
  } catch (err) {
    res.status(500).send(err.message);
  }
};
