const db = require("../../models");
const Fournisseur = db.fournisseurs;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email et mot de passe requis" });

    const fournisseur = await Fournisseur.findOne({ where: { email } });
    if (!fournisseur)
      return res.status(404).json({ message: "Email ou mot de passe incorrect" });

    const valid = await bcrypt.compare(password, fournisseur.password);
    if (!valid)
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });

    const token = jwt.sign({ id: fournisseur.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(200).json({
      message: "Connexion réussie",
      token,
      fournisseur: {
        id: fournisseur.id,
        nom: fournisseur.nom,
        email: fournisseur.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
};
