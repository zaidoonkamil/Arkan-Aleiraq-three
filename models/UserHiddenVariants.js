const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const UserHiddenVariant = sequelize.define("UserHiddenVariant", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  variant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = UserHiddenVariant;
