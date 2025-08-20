module.exports = (sequelize, DataTypes) => {
  const Agency = sequelize.define("agence", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
    },
    phone: {
      type: DataTypes.STRING,
    },
    providerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  Agency.associate = (models) => {
    // Chaque agence appartient à un fournisseur
    Agency.belongsTo(models.fournisseurs, {
      foreignKey: "providerId",
      as: "provider",
    });

    // Une agence peut avoir plusieurs voitures
    Agency.hasMany(models.voitures, {
      foreignKey: "agencyId",
      as: "cars",
    });

    // Une agence peut être agence de départ de plusieurs réservations
    Agency.hasMany(models.reservations, {
      foreignKey: "pickupAgencyId",
      as: "pickupReservations",
    });

    // Une agence peut être agence de retour de plusieurs réservations
    Agency.hasMany(models.reservations, {
      foreignKey: "returnAgencyId",
      as: "returnReservations",
    });
  };

  return Agency;
};
