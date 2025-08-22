const express = require("express");
const bodyParser = require("body-parser");
const db = require("./models");
const authRoutes = require("./routes/auth.routes");
const fournisseurRoutes = require("./routes/fournisseur.routes");
const utilisateurRoutes = require("./routes/utilisateur.routes");
const voitureRoutes = require("./routes/voiture.routes");
const categorieRoutes = require("./routes/categorie.routes");
const reservationsRoutes = require("./routes/reservations.routes");
const availabilityRoutes = require("./routes/availability.routes");
const factureRoutes = require("./routes/facture.routes");
const agenceRoutes = require('./routes/agence.routes');
const fournisseurAuthRoutes = require("./routes/auth/fournisseurAuth.routes");
const userAuthRoutes = require("./routes/auth/userAuth.routes");
const driverRoutes = require("./routes/driver.routes");
const accessoryRoutes = require("./routes/accessory.routes");
const uploadRoutes = require("./routes/upload.routes");
const adminRoutes = require("./routes/admin.routes");


const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use("/api/auth", authRoutes);
app.use("/api/auth/fournisseur", fournisseurAuthRoutes);
app.use("/api/auth/user", userAuthRoutes);
app.use("/api/fournisseurs", fournisseurRoutes);
app.use("/api/utilisateurs", utilisateurRoutes);
app.use("/api/voitures", voitureRoutes);
app.use("/api/categories", categorieRoutes);
app.use("/api/reservations", reservationsRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/factures", factureRoutes );
app.use('/api/agences', agenceRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/accessories", accessoryRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);

// Servir les fichiers statiques (images)
app.use("/uploads", express.static("uploads"));

const isDev = process.env.NODE_ENV !== "production";

db.sequelize.sync().then(async () => {
  console.log("Database synchronized");

  // Ensure required columns exist without using alter on all tables
  try {
    const qi = db.sequelize.getQueryInterface();
    const { DataTypes } = db.Sequelize;
    // Ensure avatars directory exists
    const fs = require('fs');
    if (!fs.existsSync('uploads/avatars')) {
      fs.mkdirSync('uploads/avatars', { recursive: true });
    }
    const voitureTable = await qi.describeTable('voitures');
    if (!voitureTable.fournisseurId) {
      await qi.addColumn('voitures', 'fournisseurId', { type: DataTypes.INTEGER, allowNull: true });
      console.log('Added voitures.fournisseurId column');
    }
    if (!voitureTable.images) {
      await qi.addColumn('voitures', 'images', { type: DataTypes.TEXT, allowNull: true });
      console.log('Added voitures.images column');
    }
    if (!voitureTable.driverId) {
      await qi.addColumn('voitures', 'driverId', { type: DataTypes.INTEGER, allowNull: true });
      console.log('Added voitures.driverId column');
    }

    // Ensure reservations table has required foreign keys/columns
    try {
      const reservationTable = await qi.describeTable('reservations');

      if (!reservationTable.voitureId) {
        await qi.addColumn('reservations', 'voitureId', { type: DataTypes.INTEGER, allowNull: false });
        console.log('Added reservations.voitureId column');
      }
      if (!reservationTable.clientId) {
        await qi.addColumn('reservations', 'clientId', { type: DataTypes.INTEGER, allowNull: false });
        console.log('Added reservations.clientId column');
      }
      if (!reservationTable.fournisseurId) {
        await qi.addColumn('reservations', 'fournisseurId', { type: DataTypes.INTEGER, allowNull: false });
        console.log('Added reservations.fournisseurId column');
      }
      if (!reservationTable.pickupAgencyId) {
        await qi.addColumn('reservations', 'pickupAgencyId', { type: DataTypes.INTEGER, allowNull: false });
        console.log('Added reservations.pickupAgencyId column');
      }
      if (!reservationTable.returnAgencyId) {
        await qi.addColumn('reservations', 'returnAgencyId', { type: DataTypes.INTEGER, allowNull: false });
        console.log('Added reservations.returnAgencyId column');
      }
      if (!reservationTable.dateReservation) {
        await qi.addColumn('reservations', 'dateReservation', { type: DataTypes.DATE, allowNull: true });
        console.log('Added reservations.dateReservation column');
      }
    } catch (e) {
      console.warn('Reservations schema check/add failed:', e?.message || e);
    }

    // Ensure availabilities table has required columns
    try {
      const availTable = await qi.describeTable('availabilities');
      if (!availTable.voitureId) {
        await qi.addColumn('availabilities', 'voitureId', { type: DataTypes.INTEGER, allowNull: false });
        console.log('Added availabilities.voitureId column');
      }
      if (!availTable.startTime) {
        await qi.addColumn('availabilities', 'startTime', { type: DataTypes.TIME, allowNull: true });
        console.log('Added availabilities.startTime column');
      } else if (availTable.startTime && availTable.startTime.allowNull === false) {
        await qi.changeColumn('availabilities', 'startTime', { type: DataTypes.TIME, allowNull: true });
        console.log('Altered availabilities.startTime to allow NULL');
      }
      if (!availTable.endTime) {
        await qi.addColumn('availabilities', 'endTime', { type: DataTypes.TIME, allowNull: true });
        console.log('Added availabilities.endTime column');
      } else if (availTable.endTime && availTable.endTime.allowNull === false) {
        await qi.changeColumn('availabilities', 'endTime', { type: DataTypes.TIME, allowNull: true });
        console.log('Altered availabilities.endTime to allow NULL');
      }
      if (!availTable.manuallyEditable) {
        await qi.addColumn('availabilities', 'manuallyEditable', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true });
        console.log('Added availabilities.manuallyEditable column');
      }
    } catch (e) {
      console.warn('Availabilities schema check/add failed:', e?.message || e);
    }
    // Ensure optional profilePicture columns exist
    try {
      const usersTable = await qi.describeTable('utilisateurs');
      if (!usersTable.profilePicture) {
        await qi.addColumn('utilisateurs', 'profilePicture', { type: DataTypes.STRING, allowNull: true });
        console.log('Added utilisateurs.profilePicture column');
      }
    } catch (e) { console.warn('utilisateurs.profilePicture check failed:', e?.message || e) }

    try {
      const fournisseursTable = await qi.describeTable('fournisseurs');
      if (!fournisseursTable.profilePicture) {
        await qi.addColumn('fournisseurs', 'profilePicture', { type: DataTypes.STRING, allowNull: true });
        console.log('Added fournisseurs.profilePicture column');
      }
    } catch (e) { console.warn('fournisseurs.profilePicture check failed:', e?.message || e) }

    try {
      const adminsTable = await qi.describeTable('admins');
      if (!adminsTable.profilePicture) {
        await qi.addColumn('admins', 'profilePicture', { type: DataTypes.STRING, allowNull: true });
        console.log('Added admins.profilePicture column');
      }
    } catch (e) { console.warn('admins.profilePicture check failed:', e?.message || e) }

  } catch (e) {
    console.warn('Schema check/add failed:', e?.message || e);
  }

  app.listen(3000, () => {
    console.log("Server started at http://localhost:3000");
  });
});