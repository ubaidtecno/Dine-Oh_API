const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "influencer_group",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    restaurant_owner_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    }, // e.g., "Food Vloggers"
    description: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: 1,
  }
);
