const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "item_add_ons",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    restaurant_id: {
      type: Sequelize.BIGINT,
    },
    add_ons_id: {
      type: Sequelize.BIGINT,
    },
    item_id: {
      type: Sequelize.BIGINT,
    },
    type_id: {
      type: Sequelize.BIGINT,
    },
    price: {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0,
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: 1,
  }
);
