const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Product = sequelize.define("Product", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    images: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    videoUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    timestamps: true,
});


module.exports = Product;
