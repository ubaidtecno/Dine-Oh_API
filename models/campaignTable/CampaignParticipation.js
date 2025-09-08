const Sequelize = require("sequelize");
const db = require("../../config/db");

module.exports = db.sequelize.define(
  "campaign_participation",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    campaign_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    influencer_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    type: {
      type: Sequelize.ENUM("application", "invite"), // who initiated
      allowNull: false,
    },
    message: {
      type: Sequelize.TEXT,
    },
    status: {
      type: Sequelize.ENUM(
        "pending", // just applied/invited
        "accepted", // accepted
        "rejected", // influencer applied but rejected
        "declined", // influencer declined invite
        "withdrawn" // influencer withdrew application
      ),
      defaultValue: "pending",
    },
  },
  {
    timestamps: 1,
  }
);
