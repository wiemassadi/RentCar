const db = require("../models");
const Utilisateur = db.utilisateurs;
const Fournisseur = db.fournisseurs;
const bcrypt = require("bcrypt");
exports.create = async (req, res) => {
  try {
    const { nom, prenom , email, adresse, password } = req.body;

    if (!nom || !email || !password) {
      return res.status(400).json({ message: "Nom, email et mot de passe sont obligatoires" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await Utilisateur.create({
      nom,
      prenom,
      email,
      adresse,
      password: hashedPassword,
      adminId: req.admin.id,
    });

    res.status(201).json({ message: "Utilisateur créé avec succès", user });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
};

exports.addFournisseur = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findByPk(req.params.userId);
    if (!utilisateur) return res.status(404).send("Utilisateur non trouvé");

    const fournisseur = await Fournisseur.findByPk(req.params.fournisseurId);
    if (!fournisseur) return res.status(404).send("Fournisseur non trouvé");

    await utilisateur.addFournisseur(fournisseur);
    res.status(200).send("Fournisseur lié à l'utilisateur");
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.findAll = async (req, res) => {
  try {
    const utilisateurs = await Utilisateur.findAll({
      include: "fournisseurs"
    });
    res.status(200).json(utilisateurs);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findByPk(req.params.id);
    if (!utilisateur) {
      return res.status(404).send("user does not exist");
    }
    await utilisateur.update(req.body);
    res.json(utilisateur);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.delete = async (req, res) => {
  try {
    const utilisateur = await db.utilisateurs.findByPk(req.params.id);
    if (!utilisateur) {
      return res.status(404).send("user does not exist");
    }
    await utilisateur.destroy();
    res.send({ message: "user successfully deleted !" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

