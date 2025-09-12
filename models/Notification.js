const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "notification",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    campaign_id: {
      type: Sequelize.BIGINT,
    },
    restaurant_owner_id: {
      type: Sequelize.BIGINT,
    },
    influencer_id: {
      type: Sequelize.BIGINT,
    },
    title: {
      type: Sequelize.STRING,
    },
    description: {
      type: Sequelize.STRING,
    },
    type: {
      type: Sequelize.STRING,
    },
    is_read: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    is_broadcast: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: 1,
  }
);
