const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "attachments",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    class: {
      type: Sequelize.STRING,
    },
    is_primary: {
      type: Sequelize.BOOLEAN,
    },
    foreign_id: {
      type: Sequelize.BIGINT,
    },
    file_name: {
      type: Sequelize.STRING,
    },
    dir: {
      type: Sequelize.STRING,
    },
    file_size: {
      type: Sequelize.INTEGER,
    },
  },
  {
    timestamps: 1,
  }
);
