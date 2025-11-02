const User = require("./user");
const UserDevice = require("./user_device");
const NotificationLog = require("./notification_log");
const Product = require("./product");
const ProductVariant = require("./ProductVariant");
const UserHiddenVariant = require("./UserHiddenVariants");
const PreparationLog = require("./PreparationLog");

PreparationLog.belongsTo(User, { foreignKey: "user_id", as: "user" , onDelete: "CASCADE",});
PreparationLog.belongsTo(ProductVariant, { foreignKey: "variant_id", as: "variant", onDelete: "CASCADE", });
PreparationLog.belongsTo(Product, { foreignKey: "product_id", as: "product", onDelete: "CASCADE", });


User.hasMany(UserDevice, { foreignKey: 'user_id', as: 'devices', onDelete: 'CASCADE' });
UserDevice.belongsTo(User, { foreignKey: 'user_id', as: 'user', onDelete: 'CASCADE' });


User.belongsToMany(ProductVariant, { through: UserHiddenVariant, foreignKey: "user_id", as: "hiddenVariants",});
ProductVariant.belongsToMany(User, { through: UserHiddenVariant, foreignKey: "variant_id", as: "hiddenByUsers",});

ProductVariant.belongsTo(User, { foreignKey: "created_by", as: "creator" });
User.hasMany(ProductVariant, { foreignKey: "created_by", as: "createdVariants" });


Product.hasMany(ProductVariant, { foreignKey: 'product_id', as: 'variants', onDelete: 'CASCADE' });
ProductVariant.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

ProductVariant.belongsTo(User, { foreignKey: "prepared_by", as: "preparer" });
User.hasMany(ProductVariant, { foreignKey: "prepared_by", as: "preparedVariants" });


module.exports = {
  User,
  UserDevice,
  NotificationLog,
  PreparationLog,
  Product,
  ProductVariant,
  UserHiddenVariant,
};
