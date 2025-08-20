const jwt = require("jsonwebtoken");
require("dotenv").config();
const db = require("../models");
const Fournisseur = db.fournisseurs;

const authFournisseur = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token manquant" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const fournisseur = await Fournisseur.findByPk(decoded.id);
    if (!fournisseur) return res.status(403).json({ message: "Accès refusé" });

    req.user = fournisseur; // on garde les infos dans req.user
    next();
  } catch (err) {
    res.status(401).json({ message: "Token invalide" });
  }
};

module.exports = authFournisseur;
