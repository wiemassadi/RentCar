const jwt = require("jsonwebtoken");
require("dotenv").config();
const db = require("../models");

// Auth middleware that accepts any authenticated role and populates req.admin, req.fournisseur or req.user
module.exports = async function authAny(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token manquant" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Try admin
    const admin = await db.admins.findByPk(userId);
    if (admin) {
      req.admin = admin;
      return next();
    }

    // Try fournisseur
    const fournisseur = await db.fournisseurs.findByPk(userId);
    if (fournisseur) {
      req.fournisseur = fournisseur;
      return next();
    }

    // Try utilisateur
    const user = await db.utilisateurs.findByPk(userId);
    if (user) {
      req.user = user;
      return next();
    }

    return res.status(403).json({ message: "Accès refusé" });
  } catch (err) {
    return res.status(401).json({ message: "Token invalide" });
  }
};


