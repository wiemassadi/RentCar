const db = require("../models");
const Utilisateur = db.utilisateurs;
const Fournisseur = db.fournisseurs;
const bcrypt = require("bcrypt");
exports.create = async (req, res) => {
  try {
    const { nom, prenom , email, adresse, password } = req.body;

    // Must be admin (middleware should set req.admin)
    if (!req.admin?.id) {
      return res.status(401).json({ message: "Admin non authentifié" });
    }

    if (!nom || !email || !password || !adresse) {
      return res.status(400).json({ message: "Nom, email, adresse et mot de passe sont obligatoires" });
    }

    // Check unique email
    const existing = await Utilisateur.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email déjà utilisé" });
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

    // Support different alias-generated mixins
    if (typeof utilisateur.addFournisseursUtilisateurs === 'function') {
      await utilisateur.addFournisseursUtilisateurs(fournisseur);
    } else if (typeof utilisateur.addFournisseur === 'function') {
      await utilisateur.addFournisseur(fournisseur);
    } else if (typeof utilisateur.addFournisseurs === 'function') {
      await utilisateur.addFournisseurs(fournisseur);
    } else {
      return res.status(500).send('Association utilisateur-fournisseur non disponible');
    }
    res.status(200).send("Fournisseur lié à l'utilisateur");
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.removeFournisseur = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findByPk(req.params.userId);
    if (!utilisateur) return res.status(404).send("Utilisateur non trouvé");

    const fournisseur = await Fournisseur.findByPk(req.params.fournisseurId);
    if (!fournisseur) return res.status(404).send("Fournisseur non trouvé");

    if (typeof utilisateur.removeFournisseursUtilisateurs === 'function') {
      await utilisateur.removeFournisseursUtilisateurs(fournisseur);
    } else if (typeof utilisateur.removeFournisseur === 'function') {
      await utilisateur.removeFournisseur(fournisseur);
    } else if (typeof utilisateur.removeFournisseurs === 'function') {
      await utilisateur.removeFournisseurs(fournisseur);
    } else {
      return res.status(500).send('Association utilisateur-fournisseur non disponible');
    }
    res.status(200).send({ message: 'Fournisseur détaché de l\'utilisateur' });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.findAll = async (req, res) => {
  try {
    if (!req.admin?.id) {
      return res.status(401).json({ message: "Admin non authentifié" });
    }
    const utilisateurs = await Utilisateur.findAll({
      where: { adminId: req.admin.id },
      include: [{ model: db.fournisseurs, as: "fournisseursUtilisateurs", through: { attributes: [] } }]
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

// ----- SELF PROFILE (utilisateur authentifié) -----
exports.getMyProfile = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Utilisateur non authentifié" });
    const utilisateur = await Utilisateur.findByPk(req.user.id);
    if (!utilisateur) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.json({
      id: utilisateur.id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      adresse: utilisateur.adresse,
      role: "utilisateur",
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Utilisateur non authentifié" });
    const { nom, prenom, email, adresse, password } = req.body || {};
    const utilisateur = await Utilisateur.findByPk(req.user.id);
    if (!utilisateur) return res.status(404).json({ message: "Utilisateur non trouvé" });

    const updatePayload = {};
    if (typeof nom === 'string') updatePayload.nom = nom;
    if (typeof prenom === 'string') updatePayload.prenom = prenom;
    if (typeof email === 'string') updatePayload.email = email;
    if (typeof adresse === 'string') updatePayload.adresse = adresse;
    if (typeof password === 'string' && password.trim().length > 0) {
      updatePayload.password = await bcrypt.hash(password.trim(), 10);
    }

    await utilisateur.update(updatePayload);
    res.json({
      id: utilisateur.id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      adresse: utilisateur.adresse,
      role: "utilisateur",
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

