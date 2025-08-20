const db = require("../models");
const Categorie = db.categories;

exports.create = async (req, res) => {
  try {
    const { nom, description, image } = req.body;

    // Vérifier si la catégorie existe déjà
    const exist = await Categorie.findOne({ where: { nom } });
    if (exist) {
      return res.status(400).json({ message: "Catégorie déjà existante" });
    }
    // Créer la nouvelle catégorie
    const newCategorie = await Categorie.create({ nom, description, image });
    res.status(201).json(newCategorie);

  } catch (err) {
    res.status(500).send(err.message);
  }
};


exports.findAll = async (req, res) => {
  try {
    const data = await Categorie.findAll();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const [updated] = await Categorie.update(req.body, { where: { id } });
    if (updated) {
      const updatedCategorie = await Categorie.findByPk(id);
      res.status(200).json(updatedCategorie);
    } else {
      res.status(404).send("Catégorie non trouvée");
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Categorie.destroy({ where: { id } });
    if (deleted) {
      res.status(200).send("Catégorie supprimée");
    } else {
      res.status(404).send("Catégorie non trouvée");
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
};
