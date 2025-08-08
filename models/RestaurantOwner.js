const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "restaurant_owner",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
    },
    mobile_code: {
      type: Sequelize.STRING,
    },
    mobile: {
      type: Sequelize.STRING(10),
    },
    PAN: {
      type: Sequelize.STRING,
    },
    GST: {
      type: Sequelize.STRING,
    },
    account_number: {
      type: Sequelize.STRING,
    },
    ifsc_code: {
      type: Sequelize.STRING,
    },
    password: {
      type: Sequelize.STRING,
    },
    last_otp: {
      type: Sequelize.STRING,
    },
    is_verified: {
      type: Sequelize.TINYINT,
    }
  },
  {
    timestamps: 1,
  }
);
