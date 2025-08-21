const express = require("express");
const router = express.Router();

const controller = require("../controllers/reservation.controller");
const authUser = require("../middlewares/authuser");
const authFournisseur = require("../middlewares/authFournisseur");

// Client routes
router.post("/", authUser, controller.createReservation);
router.put("/update", authUser, controller.modifyReservation);
router.delete("/cancel", authUser, controller.cancelReservation);
router.get("/me", authUser, controller.getMyReservations);

// Provider routes
router.get("/provider/:fournisseurId", authFournisseur, controller.getProviderReservations);
router.get("/provider/:fournisseurId/stats", authFournisseur, controller.getProviderReservationStats);

module.exports = router;
