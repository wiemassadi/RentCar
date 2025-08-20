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
    const voitureTable = await qi.describeTable('voitures');
    if (!voitureTable.fournisseurId) {
      await qi.addColumn('voitures', 'fournisseurId', { type: DataTypes.INTEGER, allowNull: true });
      console.log('Added voitures.fournisseurId column');
    }
  } catch (e) {
    console.warn('Schema check/add failed:', e?.message || e);
  }

  app.listen(3000, () => {
    console.log("Server started at http://localhost:3000");
  });
});