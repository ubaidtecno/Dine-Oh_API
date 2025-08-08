const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "roles",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING,
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
