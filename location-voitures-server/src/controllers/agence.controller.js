const db = require('../models');
const Agency = db.agence;
const Fournisseur = db.fournisseurs;

exports.createAgency = async (req, res) => {
  try {
    // providerId vient de l'auth (exemple, req.user.id)
    const providerId = req.user.id;

    const { name, city, address, phone } = req.body;

    if (!name || !city) {
      return res.status(400).json({ message: 'Name and city are required' });
    }

    const newAgency = await Agency.create({
      name,
      city,
      address,
      phone,
      providerId : req.user.id,
    });

    res.status(201).json(newAgency);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating agency' });
  }
};

exports.getAllAgencies = async (req, res) => {
  try {
    const providerId = req.user.id;

    const agencies = await Agency.findAll({
      where: { providerId }
    });

    res.json(agencies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching agencies' });
  }
};

exports.getAgencyById = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { id } = req.params;

    const agency = await Agency.findOne({
      where: { id, providerId }
    });

    if (!agency) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    res.json(agency);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching agency' });
  }
};

exports.updateAgency = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { id } = req.params;
    const { name, city, address, phone } = req.body;

    const agency = await Agency.findOne({
      where: { id, providerId }
    });

    if (!agency) {
      return res.status(404).json({ message: 'Agency not found or not authorized' });
    }

    await agency.update({ name, city, address, phone });

    res.json(agency);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating agency' });
  }
};

exports.deleteAgency = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { id } = req.params;

    const agency = await Agency.findOne({
      where: { id, providerId }
    });

    if (!agency) {
      return res.status(404).json({ message: 'Agency not found or not authorized' });
    }

    await agency.destroy();

    res.json({ message: 'Agency deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting agency' });
  }
};
