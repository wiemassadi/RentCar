const db = require("../../models");
const User = db.utilisateurs;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email et mot de passe requis" });

    const utilisateur = await User.findOne({ where: { email } });
    if (!utilisateur)
      return res.status(404).json({ message: "Email ou mot de passe incorrect" });

    const valid = await bcrypt.compare(password, utilisateur.password);
    if (!valid)
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });

    const token = jwt.sign({ id: utilisateur.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(200).json({
      message: "Connexion réussie",
      token,
      utilisateur: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        email: utilisateur.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
};

// register handler removed (revert)