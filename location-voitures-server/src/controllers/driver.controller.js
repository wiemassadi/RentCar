// controllers/driver.controller.js
const db = require("../models");
const Driver = db.driver;
const Provider = db.fournisseurs;
const calculateAge = require("../utils/calculateAge");
exports.createDriver = async (req, res) => {
  try {
    const { firstName, lastName, birthDate, phone, licenseNumber } = req.body;
    const providerId = req.user.id;
    const age = calculateAge(birthDate);
    if (!firstName || !lastName || !birthDate || !licenseNumber) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const birth = new Date(birthDate);
    if (isNaN(birth.getTime()) || birth > new Date()) {
      return res.status(400).json({ message: "Invalid birth date." });
    }

    if (phone && !/^[+]?\d{7,15}$/.test(phone)) {
      return res.status(400).json({ message: "Invalid phone number format." });
    }

    const existing = await Driver.findOne({ where: { licenseNumber } });
    if (existing) {
      return res.status(400).json({ message: "License number already exists." });
    }

    const driver = await Driver.create({
      firstName,
      lastName,
      birthDate,
      phone,
      licenseNumber,
      providerId,
       age
    });

    res.status(201).json({ message: "Driver created successfully.", data: driver });
  } catch (error) {
    res.status(500).json({ message: "Failed to create driver.", error: error.message });
  }
};

exports.getAllDrivers = async (req, res) => {
  try {
    const providerId = req.user.id;
    const drivers = await Driver.findAll({ where: { providerId } });
    res.status(200).json({ message: "Drivers retrieved successfully.", data: drivers });
  } catch (err) {
    res.status(500).json({ message: "Error retrieving drivers.", error: err.message });
  }
};

exports.getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findOne({
      where: { id: req.params.id, providerId: req.user.id },
    });

    if (!driver) {
      return res.status(404).json({ message: "Driver not found." });
    }

    res.status(200).json(driver);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving driver.", error: err.message });
  }
};

exports.updateDriver = async (req, res) => {
  try {
    const { firstName, lastName, birthDate, phone, licenseNumber } = req.body;
    const driver = await Driver.findOne({
      where: { id: req.params.id, providerId: req.user.id },
    });

    if (!driver) return res.status(404).json({ message: "Driver not found." });

    if (birthDate && (new Date(birthDate) > new Date())) {
      return res.status(400).json({ message: "Invalid birth date." });
    }

    if (phone && !/^[+]?\d{7,15}$/.test(phone)) {
      return res.status(400).json({ message: "Invalid phone number." });
    }

    await driver.update({ firstName, lastName, birthDate, phone, licenseNumber });
    res.status(200).json({ message: "Driver updated successfully.", data: driver });
  } catch (err) {
    res.status(500).json({ message: "Failed to update driver.", error: err.message });
  }
};

exports.deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findOne({
      where: { id: req.params.id, providerId: req.user.id },
    });

    if (!driver) return res.status(404).json({ message: "Driver not found." });

    await driver.destroy();
    res.status(200).json({ message: "Driver deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete driver.", error: err.message });
  }
};