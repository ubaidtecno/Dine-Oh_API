const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "favourite",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    class: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    foreign_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    user_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
  },
  {
    timestamps: 1,
  }
);
