const express = require("express");
const router = express.Router();
const availabilityController = require("../controllers/availability.controller");

router.get("/:voitureId", availabilityController.listCarAvailabilities);
router.post("/:voitureId", availabilityController.addAvailability);
router.put("/:id", availabilityController.updateAvailability);
router.delete("/:id", availabilityController.deleteAvailability);

module.exports = router;
