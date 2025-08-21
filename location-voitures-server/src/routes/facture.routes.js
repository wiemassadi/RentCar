// routes/facture.routes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/facture.controller");
const authUser = require("../middlewares/authuser");

router.post("/generate", authUser, controller.generateInvoice);
router.get("/", authUser, controller.getAllFactures);
router.get("/me", authUser, controller.getMyFactures);
// Basic PDF export using pdfkit
router.get("/:reservationId/pdf", async (req, res) => {
  try {
    const { reservationId } = req.params;
    const reservation = await require("../models").reservations.findByPk(reservationId, {
      include: [
        { model: require("../models").voitures, as: "reservedCar" },
        { model: require("../models").utilisateurs, as: "client" },
        { model: require("../models").fournisseurs, as: "fournisseur" }
      ]
    });
    if (!reservation) return res.status(404).send("Reservation not found");

    const PDFDocument = require("pdfkit");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${reservation.reference}.pdf`);
    const doc = new PDFDocument();
    doc.pipe(res);
    doc.fontSize(18).text("Facture de réservation", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Référence: ${reservation.reference}`);
    doc.text(`Client: ${reservation.client?.nom || ""} ${reservation.client?.prenom || ""}`);
    doc.text(`Fournisseur: ${reservation.fournisseur?.nom || ""}`);
    doc.text(`Véhicule: ${reservation.reservedCar?.marque || ""} ${reservation.reservedCar?.modele || ""}`);
    doc.text(`Période: ${new Date(reservation.dateDebut).toLocaleDateString()} - ${new Date(reservation.dateFin).toLocaleDateString()}`);
    doc.moveDown();
    doc.text(`Montant HT: ${reservation.montantTotalHT} DT`);
    doc.text(`TVA: ${reservation.montantTVA} DT`);
    doc.text(`Total TTC: ${reservation.montantTotalTTC} DT`);
    doc.end();
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
