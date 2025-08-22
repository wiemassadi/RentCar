module.exports = (sequelize, DataTypes) => {
  const Admin = sequelize.define("admin", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    email: {
  type: DataTypes.STRING,
  allowNull: false,
  unique: true,
  validate: { isEmail: true },
},
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
   
    dateCreation: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    
     gender: {
      type: DataTypes.STRING,
      allowNull: false
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true
    },
  });

  return Admin;
};
