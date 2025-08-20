module.exports = (sequelize, DataTypes) => {
  const Availability = sequelize.define("availability", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    startDate: { type: DataTypes.DATE, allowNull: false },
    endDate: { type: DataTypes.DATE, allowNull: false },
    startTime: { type: DataTypes.TIME, allowNull: false },
    endTime: { type: DataTypes.TIME, allowNull: false },
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
