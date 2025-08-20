module.exports = (sequelize, DataTypes) => {
  const Voiture = sequelize.define("voiture", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    marque: { type: DataTypes.STRING, allowNull: false },
    modele: { type: DataTypes.STRING, allowNull: false },
    annee: { type: DataTypes.INTEGER },
    prixUnitaireHT: { type: DataTypes.FLOAT, allowNull: false },
    avecAssurance: { type: DataTypes.BOOLEAN, defaultValue: false },
    statut: {
      type: DataTypes.ENUM("pending", "validated", "rejected"),
      defaultValue: "pending"
    },
    places: { type: DataTypes.INTEGER, defaultValue: 2 },
    carburant: { type: DataTypes.STRING },
    transmission: { type: DataTypes.STRING },
    matricule: { type: DataTypes.STRING, allowNull: false, unique: true },
    fournisseurId: { type: DataTypes.INTEGER, allowNull: false },
    createurId: { type: DataTypes.INTEGER, allowNull: false },
    modificateurId: { type: DataTypes.INTEGER, allowNull: true },
    categorieId: { type: DataTypes.INTEGER, allowNull: true },
    remise: {type: DataTypes.FLOAT,defaultValue: 0},
    agencyId: { type: DataTypes.INTEGER, allowNull: false,},
    driverId: {type: DataTypes.INTEGER,allowNull: true, },
    images: { type: DataTypes.TEXT, allowNull: true }, // JSON array of image URLs



  }, {
    timestamps: true
  });
Voiture.associate = (models) => {
  Voiture.belongsTo(models.agence, {foreignKey: "agencyId", as: "agency", });
  Voiture.belongsTo(models.driver, {foreignKey: "driverId",as: "driver",});
  Voiture.hasMany(models.accessory, {foreignKey: "voitureId",as: "accessories",});
     


};

  return Voiture;
};