const db = require("../models");
const Accessory = db.accessory;

exports.createAccessory = async (req, res) => {
  try {
    const { name, description, voitureId, fournisseurId } = req.body;

    const newAccessory = await Accessory.create({
      name,
      description,
      voitureId,
      fournisseurId,
    });

    res.status(201).json(newAccessory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllAccessories = async (req, res) => {
  try {
    const accessories = await Accessory.findAll({
      include: ["voiture", "fournisseur"],
    });

    res.status(200).json(accessories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAccessoryById = async (req, res) => {
  try {
    const accessory = await Accessory.findByPk(req.params.id, {
      include: ["voiture", "fournisseur"],
    });

    if (!accessory) return res.status(404).json({ error: "Accessoire non trouvé" });

    res.status(200).json(accessory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAccessory = async (req, res) => {
  try {
    const deleted = await Accessory.destroy({ where: { id: req.params.id } });

    if (!deleted) return res.status(404).json({ error: "Accessoire non trouvé" });

    res.status(200).json({ message: "Accessoire supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
