const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "groups",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
    },
    visibility: {
      type: Sequelize.ENUM("public", "private", "hidden"),
      defaultValue: "public",
    },
    created_by: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
  },
  { timestamps: true }
);
