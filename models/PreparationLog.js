const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PreparationLog = sequelize.define(
  "PreparationLog",
  {
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
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    timestamps: true, 
    tableName: "preparation_logs",
  }
);

module.exports = PreparationLog;
