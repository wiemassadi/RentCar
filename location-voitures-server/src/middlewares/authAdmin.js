const jwt = require("jsonwebtoken");
require("dotenv").config();
const db = require("../models");
const Admin = db.admins;

const authAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).send("Token manquant");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findByPk(decoded.id);
    if (!admin) return res.status(403).send("Accès refusé");
    
    req.admin = admin; 
    next();
  } catch (err) {
    res.status(401).send("Token invalide");
  }
};

module.exports = authAdmin;
