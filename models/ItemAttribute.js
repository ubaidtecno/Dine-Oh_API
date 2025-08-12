const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "item_attribute",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    item_id: {
      type: Sequelize.BIGINT,
    },
    attribute_id: {
      type: Sequelize.BIGINT,
    },
    variation_id: {
      type: Sequelize.BIGINT,
    },
    price: {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0,
    },
    value: {
      type: Sequelize.STRING,
    },
  },
  {
    timestamps: 1,
  }
);
