const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "table_slot",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    restaurant_id: {
      type: Sequelize.BIGINT,
    },
    slot_name: {
      type: Sequelize.STRING,
    },
    start_time: {
      type: Sequelize.STRING,
    },
    end_time: {
      type: Sequelize.STRING,
    },
    availability: {
      type: Sequelize.STRING,
    },
    is_available: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: 1,
  }
);
