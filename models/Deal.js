const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "deal",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    restaurant_id: {
      type: Sequelize.BIGINT,
    },
    deal_type_id: {
      type: Sequelize.BIGINT,
    },
    title: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    description: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    is_pre_booking: {
      type: Sequelize.TINYINT,
      defaultValue: 0,
    },
    is_walk_in: {
      type: Sequelize.TINYINT,
      defaultValue: 0,
    },
    is_both: {
      type: Sequelize.TINYINT,
      defaultValue: 0,
    },
    start_date: {
      type: Sequelize.DATE,
      defaultValue: null,
    },
    end_date: {
      type: Sequelize.DATE,
      defaultValue: null,
    },
    time_slot: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    min_spend: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    active_days: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
  },
  {
    timestamps: 1,
  }
);
