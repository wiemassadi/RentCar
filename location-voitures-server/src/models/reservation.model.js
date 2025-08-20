module.exports = (sequelize, DataTypes) => {
  const Reservation = sequelize.define("reservation", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    dateDebut: { type: DataTypes.DATE, allowNull: false },
    dateFin: { type: DataTypes.DATE, allowNull: false },
    heureDebut: { type: DataTypes.TIME, allowNull: false },
    heureFin: { type: DataTypes.TIME, allowNull: false },
    prixUnitaireHT: { type: DataTypes.FLOAT, allowNull: false },
    montantTotalHT: { type: DataTypes.FLOAT, allowNull: false },
    tauxTVA: { type: DataTypes.FLOAT, defaultValue: 0.19 },
    montantTVA: { type: DataTypes.FLOAT, allowNull: false },
    remise: { type: DataTypes.FLOAT, defaultValue: 0 },
    montantTotalTTC: { type: DataTypes.FLOAT, allowNull: false },
    statut: { type: DataTypes.ENUM("pending", "confirmed", "cancelled"), defaultValue: "pending" },
    dateReservation: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    reference: { type: DataTypes.STRING, unique: true },
    pickupAgencyId: { type: DataTypes.INTEGER, allowNull: false, },
    returnAgencyId: { type: DataTypes.INTEGER, allowNull: false, },
    voitureId: { type: DataTypes.INTEGER, allowNull: false, },
    clientId: { type: DataTypes.INTEGER, allowNull: false, },
    fournisseurId: { type: DataTypes.INTEGER, allowNull: false, },

  });

  Reservation.associate = (models) => {
    Reservation.belongsTo(models.utilisateurs, { foreignKey: "clientId", as: "client" });
    Reservation.belongsTo(models.fournisseurs, { foreignKey: "fournisseurId" });
    Reservation.belongsTo(models.voitures, { foreignKey: "voitureId", as: "reservedCar" });
    Reservation.belongsTo(models.agence, { foreignKey: "pickupAgencyId", as: "pickupAgency" });
    Reservation.belongsTo(models.agence, { foreignKey: "returnAgencyId", as: "returnAgency" });
  };

  return Reservation;
};
