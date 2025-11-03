const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "influencer_group_member",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    influencer_group_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    influencer_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
  },
  {
    timestamps: 1,
  }
);
