const db = require('../models');
const Notification = db.notifications;
const { Op } = require('sequelize');

class NotificationService {
  // Créer une notification
  static async createNotification(notificationData) {
    try {
      const notification = await Notification.create(notificationData);
      return notification;
    } catch (error) {
      console.error('Erreur création notification:', error);
      throw error;
    }
  }

  // Créer une notification de validation de véhicule
  static async notifyVehicleValidation(vehicleId, fournisseurId, isAccepted, adminId) {
    const type = isAccepted ? 'VEHICLE_ACCEPTED' : 'VEHICLE_REJECTED';
    const title = isAccepted ? 'Véhicule accepté' : 'Véhicule rejeté';
    const message = isAccepted 
      ? 'Votre véhicule a été accepté et est maintenant disponible sur la plateforme.'
      : 'Votre véhicule a été rejeté. Veuillez vérifier les informations et le soumettre à nouveau.';

    return await this.createNotification({
      type,
      title,
      message,
      recipientType: 'FOURNISSEUR',
      recipientId: fournisseurId,
      senderType: 'ADMIN',
      senderId: adminId,
      relatedEntityType: 'VEHICLE',
      relatedEntityId: vehicleId,
      priority: isAccepted ? 'MEDIUM' : 'HIGH'
    });
  }

  // Notifier une nouvelle réservation
  static async notifyNewReservation(reservationId, fournisseurId, clientId, vehicleId) {
    // Notification pour le fournisseur
    await this.createNotification({
      type: 'NEW_RESERVATION',
      title: 'Nouvelle réservation',
      message: 'Un client a réservé un de vos véhicules.',
      recipientType: 'FOURNISSEUR',
      recipientId: fournisseurId,
      senderType: 'UTILISATEUR',
      senderId: clientId,
      relatedEntityType: 'RESERVATION',
      relatedEntityId: reservationId,
      priority: 'HIGH'
    });

    // Notification pour le client (confirmation)
    await this.createNotification({
      type: 'NEW_RESERVATION',
      title: 'Réservation confirmée',
      message: 'Votre réservation a été créée avec succès.',
      recipientType: 'UTILISATEUR',
      recipientId: clientId,
      senderType: 'SYSTEM',
      relatedEntityType: 'RESERVATION',
      relatedEntityId: reservationId,
      priority: 'MEDIUM'
    });
  }

  // Notifier une modification de réservation
  static async notifyReservationModified(reservationId, fournisseurId, clientId, vehicleId) {
    // Notification pour le fournisseur
    await this.createNotification({
      type: 'RESERVATION_MODIFIED',
      title: 'Réservation modifiée',
      message: 'Un client a modifié une réservation existante.',
      recipientType: 'FOURNISSEUR',
      recipientId: fournisseurId,
      senderType: 'UTILISATEUR',
      senderId: clientId,
      relatedEntityType: 'RESERVATION',
      relatedEntityId: reservationId,
      priority: 'MEDIUM'
    });

    // Notification pour le client
    await this.createNotification({
      type: 'RESERVATION_MODIFIED',
      title: 'Réservation modifiée',
      message: 'Votre réservation a été modifiée avec succès.',
      recipientType: 'UTILISATEUR',
      recipientId: clientId,
      senderType: 'SYSTEM',
      relatedEntityType: 'RESERVATION',
      relatedEntityId: reservationId,
      priority: 'MEDIUM'
    });
  }

  // Notifier une annulation de réservation
  static async notifyReservationCancelled(reservationId, fournisseurId, clientId, vehicleId) {
    // Notification pour le fournisseur
    await this.createNotification({
      type: 'RESERVATION_CANCELLED',
      title: 'Réservation annulée',
      message: 'Un client a annulé une réservation.',
      recipientType: 'FOURNISSEUR',
      recipientId: fournisseurId,
      senderType: 'UTILISATEUR',
      senderId: clientId,
      relatedEntityType: 'RESERVATION',
      relatedEntityId: reservationId,
      priority: 'HIGH'
    });

    // Notification pour le client
    await this.createNotification({
      type: 'RESERVATION_CANCELLED',
      title: 'Réservation annulée',
      message: 'Votre réservation a été annulée avec succès.',
      recipientType: 'UTILISATEUR',
      recipientId: clientId,
      senderType: 'SYSTEM',
      relatedEntityType: 'RESERVATION',
      relatedEntityId: reservationId,
      priority: 'MEDIUM'
    });
  }

  // Notifier l'ajout d'un nouveau véhicule
  static async notifyNewVehicleAdded(vehicleId, fournisseurId, adminId) {
    // If adminId is provided, notify that admin; else notify all admins
    if (adminId) {
      return await this.createNotification({
        type: 'NEW_VEHICLE_ADDED',
        title: 'Nouveau véhicule ajouté',
        message: 'Un nouveau véhicule a été ajouté et nécessite votre validation.',
        recipientType: 'ADMIN',
        recipientId: adminId,
        senderType: 'FOURNISSEUR',
        senderId: fournisseurId,
        relatedEntityType: 'VEHICLE',
        relatedEntityId: vehicleId,
        priority: 'MEDIUM'
      });
    }
    try {
      const admins = await db.admins.findAll({ attributes: ['id'] });
      await Promise.all(
        admins.map(a => this.createNotification({
          type: 'NEW_VEHICLE_ADDED',
          title: 'Nouveau véhicule ajouté',
          message: 'Un nouveau véhicule a été ajouté et nécessite votre validation.',
          recipientType: 'ADMIN',
          recipientId: a.id,
          senderType: 'FOURNISSEUR',
          senderId: fournisseurId,
          relatedEntityType: 'VEHICLE',
          relatedEntityId: vehicleId,
          priority: 'MEDIUM'
        }))
      );
    } catch (e) {
      console.error('Notify all admins failed:', e?.message || e);
    }
  }

  // Créer un rappel de réservation
  static async createReservationReminder(reservationId, clientId, vehicleId, startDate) {
    const reminderDate = new Date(startDate);
    reminderDate.setDate(reminderDate.getDate() - 2); // 2 jours avant

    return await this.createNotification({
      type: 'RESERVATION_REMINDER',
      title: 'Rappel de réservation',
      message: 'Votre réservation commence dans 2 jours. N\'oubliez pas de récupérer votre véhicule.',
      recipientType: 'UTILISATEUR',
      recipientId: clientId,
      senderType: 'SYSTEM',
      relatedEntityType: 'RESERVATION',
      relatedEntityId: reservationId,
      priority: 'HIGH',
      scheduledFor: reminderDate,
      metadata: {
        startDate: startDate,
        vehicleId: vehicleId
      }
    });
  }

  // Marquer une notification comme lue
  static async markAsRead(notificationId, userId) {
    try {
      await Notification.update(
        { isRead: true },
        { 
          where: { 
            id: notificationId,
            recipientId: userId
          }
        }
      );
      return true;
    } catch (error) {
      console.error('Erreur marquage notification:', error);
      throw error;
    }
  }

  // Marquer toutes les notifications comme lues
  static async markAllAsRead(userId, userType) {
    try {
      await Notification.update(
        { isRead: true },
        { 
          where: { 
            recipientId: userId,
            recipientType: userType
          }
        }
      );
      return true;
    } catch (error) {
      console.error('Erreur marquage notifications:', error);
      throw error;
    }
  }

  // Obtenir les notifications d'un utilisateur
  static async getUserNotifications(userId, userType, limit = 50, offset = 0) {
    try {
      const notifications = await Notification.findAll({
        where: {
          recipientId: userId,
          recipientType: userType
        },
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });
      return notifications;
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      throw error;
    }
  }

  // Obtenir le nombre de notifications non lues
  static async getUnreadCount(userId, userType) {
    try {
      const count = await Notification.count({
        where: {
          recipientId: userId,
          recipientType: userType,
          isRead: false
        }
      });
      return count;
    } catch (error) {
      console.error('Erreur comptage notifications:', error);
      throw error;
    }
  }

  // Supprimer une notification
  static async deleteNotification(notificationId, userId) {
    try {
      await Notification.destroy({
        where: {
          id: notificationId,
          recipientId: userId
        }
      });
      return true;
    } catch (error) {
      console.error('Erreur suppression notification:', error);
      throw error;
    }
  }

  // Nettoyer les anciennes notifications (plus de 30 jours)
  static async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      await Notification.destroy({
        where: {
          createdAt: {
            [Op.lt]: thirtyDaysAgo
          },
          isRead: true
        }
      });
    } catch (error) {
      console.error('Erreur nettoyage notifications:', error);
    }
  }
}

module.exports = NotificationService;
