module.exports = (sequelize, DataTypes) => {
  const Facture = sequelize.define("facture", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    reference: { type: DataTypes.STRING, unique: true },
    dateFacture: { type: DataTypes.DATE, allowNull: false },
    montantTotalHT: { type: DataTypes.FLOAT, allowNull: false },
    montantTVA: { type: DataTypes.FLOAT, allowNull: false },
    montantTotalTTC: { type: DataTypes.FLOAT, allowNull: false },
  });

  Facture.associate = models => {
    Facture.belongsTo(models.reservations, { foreignKey: "reservationId", as: "reservation" });
  };

  return Facture;
};
