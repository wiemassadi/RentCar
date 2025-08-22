const { Sequelize, DataTypes } = require('sequelize');
const dbConfig = require("../../config/db.config");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  pool: dbConfig.pool
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.admins = require("./admin.model")(sequelize, Sequelize.DataTypes);
db.fournisseurs = require("./fournisseur.model")(sequelize, Sequelize.DataTypes);
db.utilisateurs = require("./utilisateur.model")(sequelize, Sequelize.DataTypes);
db.voitures = require("./voiture.model")(sequelize, DataTypes);
db.categories = require("./categorie.model")(sequelize, DataTypes);
db.reservations = require("./reservation.model")(sequelize, DataTypes);
db.availabilities = require("./availability.model")(sequelize, DataTypes);
db.factures = require("./facture.model")(sequelize, Sequelize.DataTypes);
db.agence = require("./agence.model")(sequelize, DataTypes);
db.driver = require("./driver.model")(sequelize, DataTypes);
db.accessory = require("./accessory.model")(sequelize, Sequelize);
db.notifications = require("./notification.model")(sequelize, DataTypes);

//relation entre fournisseur et admin
db.admins.hasMany(db.fournisseurs, { foreignKey: "adminId" });
db.fournisseurs.belongsTo(db.admins, { foreignKey: "adminId" });

// Associer Voiture à Fournisseur (1 fournisseur → plusieurs voitures)
db.fournisseurs.hasMany(db.voitures, { as: "voitures" });
db.voitures.belongsTo(db.fournisseurs, { foreignKey: "fournisseurId", as: "fournisseur" });

// une catégorie contient plusieurs voitures

db.voitures.belongsTo(db.categories, { foreignKey: "categorieId" });
db.categories.hasMany(db.voitures, { foreignKey: "categorieId" });

// Associations reservation
db.voitures.hasMany(db.reservations, { foreignKey: "voitureId" });
db.fournisseurs.hasMany(db.reservations, { foreignKey: "fournisseurId" });
db.utilisateurs.hasMany(db.reservations, { foreignKey: "clientId" });

// Associations disponibilite
db.voitures.hasMany(db.availabilities, { foreignKey: "voitureId", as: "availabilities" });



Object.keys(db).forEach((modelName) => {
  if ("associate" in db[modelName]) {
    db[modelName].associate(db);
  }
});

module.exports = db;
