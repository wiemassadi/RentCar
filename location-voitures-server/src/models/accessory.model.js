module.exports = (sequelize, DataTypes) => {
  const Accessory = sequelize.define("accessory", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    voitureId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fournisseurId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    timestamps: true,
  });

  Accessory.associate = (models) => {
    Accessory.belongsTo(models.voitures, {
      foreignKey: "voitureId",
      as: "voiture",
    });

    Accessory.belongsTo(models.fournisseurs, {
      foreignKey: "fournisseurId",
      as: "fournisseur",
    });
  };

  return Accessory;
};
