const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "working_day",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    restaurant_id: {
      type: Sequelize.BIGINT,
      defaultValue: null,
    },
    day: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    starting_time: {
      type: Sequelize.TIME,
      defaultValue: null,
    },
    ending_time: {
      type: Sequelize.TIME,
      defaultValue: null,
    },
  },
  {
    timestamps: 1,
  }
);
