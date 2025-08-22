module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM(
      'VEHICLE_ACCEPTED',
      'VEHICLE_REJECTED', 
      'NEW_RESERVATION',
      'RESERVATION_MODIFIED',
      'RESERVATION_CANCELLED',
      'RESERVATION_REMINDER',
      'NEW_VEHICLE_ADDED',
      'PROFILE_UPDATED',
      'SYSTEM_MESSAGE'
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  recipientType: {
    type: DataTypes.ENUM('ADMIN', 'FOURNISSEUR', 'UTILISATEUR'),
    allowNull: false
  },
  recipientId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  senderType: {
    type: DataTypes.ENUM('ADMIN', 'FOURNISSEUR', 'UTILISATEUR', 'SYSTEM'),
    allowNull: false
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: true // SYSTEM notifications don't have a sender
  },
  relatedEntityType: {
    type: DataTypes.ENUM('VEHICLE', 'RESERVATION', 'FACTURE', 'USER', 'FOURNISSEUR'),
    allowNull: true
  },
  relatedEntityId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  priority: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
    defaultValue: 'MEDIUM'
  },
  scheduledFor: {
    type: DataTypes.DATE,
    allowNull: true // For scheduled notifications like reminders
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true // For additional data like dates, amounts, etc.
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    {
      fields: ['recipientType', 'recipientId']
    },
    {
      fields: ['isRead']
    },
    {
      fields: ['type']
    },
    {
      fields: ['scheduledFor']
    }
  ]
  });

  return Notification;
};
