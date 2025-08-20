module.exports = (sequelize, DataTypes) => {
  const Categorie = sequelize.define("categorie", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nom: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING },
    image: { type: DataTypes.STRING } 
  });

  return Categorie;
};
