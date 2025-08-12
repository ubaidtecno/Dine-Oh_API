const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "review",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    class: {
      type: Sequelize.STRING,
    },
    foreign_id: {
      type: Sequelize.BIGINT,
    },
    user_id: {
      type: Sequelize.BIGINT,
    },
    description: {
      type: Sequelize.STRING,
    },
    rating: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      defaultValue: 1,
    },
  },
  {
    timestamps: 1,
  }
);
