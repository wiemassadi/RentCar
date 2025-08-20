const express = require("express");
const router = express.Router();

const accessoryController = require("../controllers/accessory.controller");

router.post("/", accessoryController.createAccessory);
router.get("/", accessoryController.getAllAccessories);
router.get("/:id", accessoryController.getAccessoryById);
router.delete("/:id", accessoryController.deleteAccessory);

module.exports = router;
