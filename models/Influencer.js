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
    provider: {
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
    channel_id: {
      type: Sequelize.STRING,
    },
    channel_title: {
      type: Sequelize.STRING,
    },
    subscribers: {
      type: Sequelize.BIGINT,
    },
    is_influencer: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    is_verified: {
      type: Sequelize.TINYINT,
    },
    location: {
      type: Sequelize.STRING,
    },
    category: {
      type: Sequelize.STRING,
    },
  },
  {
    timestamps: 1,
  }
);
