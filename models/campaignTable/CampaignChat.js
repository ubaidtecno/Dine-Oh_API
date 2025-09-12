const Sequelize = require("sequelize");
const db = require("../../config/db");

module.exports = db.sequelize.define(
  "campaign_chat",
  {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    campaign_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    restaurant_owner_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    influencer_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    sender_type: {
      type: Sequelize.ENUM("restaurant_owner", "influencer"),
      allowNull: false,
    },
    message: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    is_read: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: 1,
  }
);
