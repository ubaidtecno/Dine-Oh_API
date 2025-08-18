const Sequelize = require("sequelize");
const db = require("../config/db");
const Roles = require("./Roles");

module.exports = db.sequelize.define(
  "users",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    role_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: Roles,
        key: "id",
      },
    },
    first_name: {
      type: Sequelize.STRING,
    },
    last_name: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
    },
    mobile_code: {
      type: Sequelize.STRING(10),
    },
    mobile: {
      type: Sequelize.STRING,
    },
    password: {
      type: Sequelize.STRING,
    },
    last_otp: {
      type: Sequelize.STRING,
    },
    provider: {
      type: Sequelize.STRING,
    },
    provider_id: {
      type: Sequelize.STRING,
    },
    access_token: {
      type: Sequelize.TEXT,
    },
    refresh_token: {
      type: Sequelize.TEXT,
    },
    expiry_date: {
      type: Sequelize.BIGINT,
    },
    is_verified: {
      type: Sequelize.TINYINT,
    },
  },
  {
    timestamps: 1,
  }
);
