const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "banner",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    description: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    url: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    is_active: {
      type: Sequelize.TINYINT,
      defaultValue: 1,
    },
  },
  {
    timestamps: 1,
  }
);
