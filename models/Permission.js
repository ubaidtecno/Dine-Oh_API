const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "permission",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    staff_role_id: {
      type: Sequelize.BIGINT,
    },
    resource_type: {
      type: Sequelize.STRING,
    },
    slug: {
      type: Sequelize.STRING,
    },
    is_create: {
      type: Sequelize.TINYINT,
      defaultValue: false,
    },
    is_read: {
      type: Sequelize.TINYINT,
      defaultValue: false,
    },
    is_update: {
      type: Sequelize.TINYINT,
      defaultValue: false,
    },
    is_delete: {
      type: Sequelize.TINYINT,
      defaultValue: false,
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
