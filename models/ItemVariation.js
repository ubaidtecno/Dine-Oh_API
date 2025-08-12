const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "item_variation",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    value: {
      type: Sequelize.STRING,
    },
    price: {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0,
    },
    item_id: {
      type: Sequelize.BIGINT,
    },
  },
  {
    timestamps: 1,
  }
);
