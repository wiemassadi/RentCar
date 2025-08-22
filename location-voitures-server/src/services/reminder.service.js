const db = require('../models');
const NotificationService = require('./notification.service');
const { Op } = require('sequelize');

class ReminderService {
  // Générer des rappels pour les réservations qui commencent dans 2 jours
  static async generateReservationReminders() {
    try {
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
      
      // Trouver les réservations qui commencent dans 2 jours et qui sont confirmées
      const reservations = await db.reservations.findAll({
        where: {
          dateDebut: {
            [Op.between]: [
              new Date(twoDaysFromNow.getTime() - 24 * 60 * 60 * 1000), // 1 jour avant
              new Date(twoDaysFromNow.getTime() + 24 * 60 * 60 * 1000)  // 1 jour après
            ]
          },
          statut: 'confirmed'
        },
        include: [
          { model: db.voitures, as: 'voiture', attributes: ['id', 'marque', 'modele'] },
          { model: db.utilisateurs, as: 'client', attributes: ['id', 'nom', 'email'] }
        ]
      });

      let remindersCreated = 0;

      for (const reservation of reservations) {
        try {
          // Vérifier si un rappel existe déjà pour cette réservation
          const existingReminder = await db.notifications.findOne({
            where: {
              type: 'RESERVATION_REMINDER',
              relatedEntityType: 'RESERVATION',
              relatedEntityId: reservation.id
            }
          });

          if (!existingReminder) {
            // Créer le rappel
            await NotificationService.createReservationReminder(
              reservation.id,
              reservation.clientId,
              reservation.voitureId,
              reservation.dateDebut
            );
            remindersCreated++;
          }
        } catch (error) {
          console.error(`Erreur création rappel pour réservation ${reservation.id}:`, error);
        }
      }

      console.log(`${remindersCreated} rappels de réservation créés`);
      return remindersCreated;
    } catch (error) {
      console.error('Erreur génération rappels:', error);
      throw error;
    }
  }

  // Nettoyer les anciennes notifications (plus de 30 jours)
  static async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deletedCount = await db.notifications.destroy({
        where: {
          createdAt: {
            [Op.lt]: thirtyDaysAgo
          },
          isRead: true
        }
      });

      console.log(`${deletedCount} anciennes notifications supprimées`);
      return deletedCount;
    } catch (error) {
      console.error('Erreur nettoyage notifications:', error);
      throw error;
    }
  }

  // Marquer comme lues les notifications liées à des entités supprimées
  static async cleanupOrphanedNotifications() {
    try {
      // Notifications pour des véhicules supprimés
      const vehicleNotifications = await db.notifications.findAll({
        where: {
          relatedEntityType: 'VEHICLE'
        }
      });

      for (const notification of vehicleNotifications) {
        const vehicle = await db.voitures.findByPk(notification.relatedEntityId);
        if (!vehicle) {
          await notification.update({ isRead: true });
        }
      }

      // Notifications pour des réservations supprimées
      const reservationNotifications = await db.notifications.findAll({
        where: {
          relatedEntityType: 'RESERVATION'
        }
      });

      for (const notification of reservationNotifications) {
        const reservation = await db.reservations.findByPk(notification.relatedEntityId);
        if (!reservation) {
          await notification.update({ isRead: true });
        }
      }

      console.log('Notifications orphelines nettoyées');
    } catch (error) {
      console.error('Erreur nettoyage notifications orphelines:', error);
    }
  }

  // Planifier les tâches de maintenance
  static scheduleMaintenanceTasks() {
    // Générer des rappels toutes les heures
    setInterval(async () => {
      try {
        await this.generateReservationReminders();
      } catch (error) {
        console.error('Erreur tâche planifiée - rappels:', error);
      }
    }, 60 * 60 * 1000); // Toutes les heures

    // Nettoyer les anciennes notifications tous les jours à 2h du matin
    setInterval(async () => {
      const now = new Date();
      if (now.getHours() === 2 && now.getMinutes() === 0) {
        try {
          await this.cleanupOldNotifications();
          await this.cleanupOrphanedNotifications();
        } catch (error) {
          console.error('Erreur tâche planifiée - nettoyage:', error);
        }
      }
    }, 60 * 1000); // Toutes les minutes
  }
}

module.exports = ReminderService;
