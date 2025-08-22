module.exports = (sequelize, DataTypes) => {
  const Availability = sequelize.define("availability", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    voitureId: { type: DataTypes.INTEGER, allowNull: false },
    startDate: { type: DataTypes.DATE, allowNull: false },
    endDate: { type: DataTypes.DATE, allowNull: false },
    startTime: { type: DataTypes.TIME, allowNull: true },
    endTime: { type: DataTypes.TIME, allowNull: true },
    manuallyEditable: { type: DataTypes.BOOLEAN, defaultValue: true }
  });

  Availability.associate = (models) => {
    Availability.belongsTo(models.voitures, {
      foreignKey: "voitureId",
      as: "carAvailability"
    });
  };

  return Availability;
};
