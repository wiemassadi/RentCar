const db = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const Admin = db.admins;
const Fournisseur = db.fournisseurs;
const Utilisateur = db.utilisateurs;

// Authentification unifiée pour tous les types d'utilisateurs
exports.login = async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    let user = null;
    let userRole = null;

    // Si userType est spécifié, chercher dans la table correspondante
    if (userType) {
      switch (userType.toLowerCase()) {
        case 'admin':
          user = await Admin.findOne({ where: { email } });
          userRole = 'admin';
          break;
        case 'fournisseur':
          user = await Fournisseur.findOne({ where: { email } });
          userRole = 'fournisseur';
          break;
        case 'utilisateur':
          user = await Utilisateur.findOne({ where: { email } });
          userRole = 'utilisateur';
          break;
        default:
          return res.status(400).json({ message: "Type d'utilisateur invalide" });
      }
    } else {
      // Si userType n'est pas spécifié, chercher dans toutes les tables
      user = await Admin.findOne({ where: { email } });
      if (user) {
        userRole = 'admin';
      } else {
        user = await Fournisseur.findOne({ where: { email } });
        if (user) {
          userRole = 'fournisseur';
        } else {
          user = await Utilisateur.findOne({ where: { email } });
          if (user) {
            userRole = 'utilisateur';
          }
        }
      }
    }

    if (!user) {
      return res.status(404).json({ message: "Email ou mot de passe incorrect" });
    }

    // Vérifier le mot de passe
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    // Générer le token avec le rôle
    const token = jwt.sign(
      { 
        id: user.id, 
        role: userRole,
        email: user.email 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: "24h" }
    );

    // Retourner les données utilisateur avec le rôle
    res.status(200).json({
      message: "Connexion réussie",
      token,
      user: {
        id: user.id,
        name: user.userName || user.nom,
        email: user.email,
        role: userRole,
        profilePicture: user.profilePicture || "",
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { userName,  dateOfBirth, email, gender, password} = req.body;
    const hash = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      userName,
     
      dateOfBirth,
      email,
      gender,
      password: hash,
  
    });

    res.status(201).send("Administrateur créé avec succès");
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// Déconnexion
exports.logout = (req, res) => {
  res.status(200).json({ message: "Admin déconnecté avec succès." });
};
