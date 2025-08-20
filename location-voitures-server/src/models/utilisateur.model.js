module.exports = (sequelize, DataTypes) => {
  const Utilisateur = sequelize.define("utilisateur", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nom: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    prenom: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    adresse: {
        type: DataTypes.STRING,
        allowNull: false,
        },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  adminId: {
  type: DataTypes.INTEGER,
  allowNull: false,
  references: {
    model: "admins",
    key: "id"
  }
}

  });

  Utilisateur.associate = (models) => {
    Utilisateur.belongsToMany(models.fournisseurs, {
      through: "UtilisateurFournisseurs",
      as: "fournisseursUtilisateurs",
      foreignKey: "utilisateurId",
      otherKey: "fournisseurId",
      timestamps: false,
    });
  };

  return Utilisateur;
};
