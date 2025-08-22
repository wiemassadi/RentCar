module.exports = (sequelize, DataTypes) => {
  const Fournisseur = sequelize.define("fournisseur", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nom: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: { isEmail: true },
    },
     password: {          
      type: DataTypes.STRING,
      allowNull: false,
    },
    telephone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    adresse: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tauxCommission: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    solde: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  Fournisseur.associate = (models) => {
    Fournisseur.belongsToMany(models.utilisateurs, {through: "UtilisateurFournisseurs", as: "utilisateursFournisseurs", foreignKey: "fournisseurId", otherKey: "utilisateurId", timestamps: false,});
    Fournisseur.hasMany(models.agence, {foreignKey: "providerId", as: "agencies",});
    Fournisseur.hasMany(models.accessory, {foreignKey: "fournisseurId", as: "accessories",});

  };
  return Fournisseur;
};
