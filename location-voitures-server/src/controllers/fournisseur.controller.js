const db = require("../models");
const Fournisseur = db.fournisseurs;
const bcrypt = require("bcrypt");
exports.create = async (req, res) => {
  try {
    const { nom, email, telephone, adresse, tauxCommission, solde, password } = req.body;

    if (!nom || !email || !password) {
      return res.status(400).json({ message: "Nom, email et mot de passe sont obligatoires" });
    }

    // Hash du mot de passe avant création
    const hashedPassword = await bcrypt.hash(password, 10);

    const fournisseur = await Fournisseur.create({
      nom,
      email,
      telephone,
      adresse,
      tauxCommission,
      solde,
      password: hashedPassword,
      adminId: req.admin?.id || null,
    });

    res.status(201).json({ message: "Fournisseur créé avec succès", fournisseur });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
};

exports.findAll = async (req, res) => {
  try {
    // Si admin connecté, filtrer par adminId
    const where = req.admin?.id ? { adminId: req.admin.id } : {};
    const fournisseurs = await Fournisseur.findAll({ where });
    res.json(fournisseurs);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.update = async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findByPk(req.params.id);
    if (!fournisseur) {
      return res.status(404).send("Fournisseur non trouvé");
    }
    // Empêcher de changer adminId via update côté API
    const { adminId, ...payload } = req.body || {}
    await fournisseur.update(payload);
    res.json(fournisseur);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.delete = async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findByPk(req.params.id);
    if (!fournisseur) {
      return res.status(404).send("Fournisseur non trouvé");
    }
    await fournisseur.destroy();
    res.send({ message: "Fournisseur supprimé avec succès !" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};


exports.getUtilisateurs = async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findByPk(req.params.fournisseurId, {
      include: "utilisateurs" 
    });

    if (!fournisseur) return res.status(404).send("Fournisseur non trouvé");

    res.status(200).json(fournisseur.utilisateurs);
  } catch (err) {
    res.status(500).send(err.message);
  }
};