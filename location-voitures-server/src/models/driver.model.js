module.exports = (sequelize, DataTypes) => {
    const Driver = sequelize.define("driver", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        firstName: { type: DataTypes.STRING, allowNull: false },
        lastName: { type: DataTypes.STRING, allowNull: false },
        birthDate: { type: DataTypes.DATEONLY, allowNull: false },
        phone: { type: DataTypes.STRING, allowNull: true },
        licenseNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
        providerId: { type: DataTypes.INTEGER, allowNull: false },
        age: {type: DataTypes.INTEGER,allowNull: true,  },
    });

    Driver.associate = (models) => {
        Driver.belongsTo(models.fournisseurs, { foreignKey: "providerId", as: "provider" });
        Driver.hasOne(models.voitures, {foreignKey: "driverId",as: "voiture"});
    };
   





    return Driver;
};