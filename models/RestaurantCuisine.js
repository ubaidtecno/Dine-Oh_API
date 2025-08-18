const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "restaurant_cuisine",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    restaurant_id: {
      type: Sequelize.BIGINT,
    },
    cuisine_id: {
      type: Sequelize.BIGINT,
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
