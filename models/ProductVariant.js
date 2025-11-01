const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Product = require("./product");
const User = require("./user");

const ProductVariant = sequelize.define("ProductVariant", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    color: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    prepared_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    ProductCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM("قيد التجهيز", "تم التجهيز"),
        allowNull: false,
        defaultValue: "قيد التجهيز"
    },
    size: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, {
    timestamps: true,
});


module.exports = ProductVariant;
