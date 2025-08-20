const express = require("express");
const router = express.Router();

const controller = require("../controllers/reservation.controller");
const authUser = require("../middlewares/authuser");
const authFournisseur = require("../middlewares/authFournisseur");

// Client routes
router.post("/", authUser, controller.createReservation);
router.put("/update", controller.modifyReservation);
router.delete("/cancel", controller.cancelReservation);

// Provider routes
router.get("/provider/:fournisseurId", authFournisseur, controller.getProviderReservations);
router.get("/provider/:fournisseurId/stats", authFournisseur, controller.getProviderReservationStats);
router.get("/provider/:fournisseurId/current", authFournisseur, controller.getProviderCurrentReservations);
router.get("/provider/:fournisseurId/future", authFournisseur, controller.getProviderFutureReservations);
router.get("/provider/:fournisseurId/vehicles-in-reservation", authFournisseur, controller.getProviderVehiclesInReservation);

module.exports = router;
