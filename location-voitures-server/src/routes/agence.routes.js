const express = require('express');
const router = express.Router();
const agenceController = require('../controllers/agence.controller');

const authFournisseur = require("../middlewares/authFournisseur");

router.post('/', authFournisseur, agenceController.createAgency);           // Create agency
router.get('/', authFournisseur, agenceController.getAllAgencies);          // List agencies du fournisseur connecté
// Alias pour compatibilité frontend: retourne les agences du fournisseur authentifié
router.get('/provider/:providerId', authFournisseur, agenceController.getAllAgencies);
router.get('/:id', authFournisseur, agenceController.getAgencyById);         // Détail agence par id (si appartient au fournisseur)
router.put('/:id', authFournisseur, agenceController.updateAgency);          // Modifier agence
router.delete('/:id', authFournisseur, agenceController.deleteAgency);       // Supprimer agence

module.exports = router;
