const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "influencer",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    user_name: {
      type: Sequelize.STRING,
    },
    name: {
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
    is_verified: {
      type: Sequelize.TINYINT,
    },
  },
  {
    timestamps: 1,
  }
);
