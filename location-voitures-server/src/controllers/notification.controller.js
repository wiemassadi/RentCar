const NotificationService = require('../services/notification.service');

// Obtenir les notifications de l'utilisateur connecté
const getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let userType, userId;
    
    if (req.admin) {
      userType = 'ADMIN';
      userId = req.admin.id;
    } else if (req.fournisseur) {
      userType = 'FOURNISSEUR';
      userId = req.fournisseur.id;
    } else if (req.user) {
      userType = 'UTILISATEUR';
      userId = req.user.id;
    } else {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const notifications = await NotificationService.getUserNotifications(
      userId, 
      userType, 
      parseInt(limit), 
      offset
    );

    const unreadCount = await NotificationService.getUnreadCount(userId, userType);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: notifications.length
        },
        unreadCount
      }
    });
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des notifications' 
    });
  }
};

// Marquer une notification comme lue
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    let userId;
    if (req.admin) {
      userId = req.admin.id;
    } else if (req.fournisseur) {
      userId = req.fournisseur.id;
    } else if (req.user) {
      userId = req.user.id;
    } else {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    await NotificationService.markAsRead(id, userId);
    
    res.json({
      success: true,
      message: 'Notification marquée comme lue'
    });
  } catch (error) {
    console.error('Erreur marquage notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du marquage de la notification' 
    });
  }
};

// Marquer toutes les notifications comme lues
const markAllAsRead = async (req, res) => {
  try {
    let userType, userId;
    
    if (req.admin) {
      userType = 'ADMIN';
      userId = req.admin.id;
    } else if (req.fournisseur) {
      userType = 'FOURNISSEUR';
      userId = req.fournisseur.id;
    } else if (req.user) {
      userType = 'UTILISATEUR';
      userId = req.user.id;
    } else {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    await NotificationService.markAllAsRead(userId, userType);
    
    res.json({
      success: true,
      message: 'Toutes les notifications ont été marquées comme lues'
    });
  } catch (error) {
    console.error('Erreur marquage notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du marquage des notifications' 
    });
  }
};

// Supprimer une notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    let userId;
    if (req.admin) {
      userId = req.admin.id;
    } else if (req.fournisseur) {
      userId = req.fournisseur.id;
    } else if (req.user) {
      userId = req.user.id;
    } else {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    await NotificationService.deleteNotification(id, userId);
    
    res.json({
      success: true,
      message: 'Notification supprimée'
    });
  } catch (error) {
    console.error('Erreur suppression notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la suppression de la notification' 
    });
  }
};

// Obtenir le nombre de notifications non lues
const getUnreadCount = async (req, res) => {
  try {
    let userType, userId;
    
    if (req.admin) {
      userType = 'ADMIN';
      userId = req.admin.id;
    } else if (req.fournisseur) {
      userType = 'FOURNISSEUR';
      userId = req.fournisseur.id;
    } else if (req.user) {
      userType = 'UTILISATEUR';
      userId = req.user.id;
    } else {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const count = await NotificationService.getUnreadCount(userId, userType);
    
    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('Erreur comptage notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du comptage des notifications' 
    });
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
};
