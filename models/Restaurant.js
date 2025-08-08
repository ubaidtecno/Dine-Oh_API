const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "restaurant",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    restaurant_owner_id: {
      type: Sequelize.BIGINT,
    },
    cuisine_id: {
      type: Sequelize.BIGINT,
    },
    name: {
      type: Sequelize.STRING,
    },
    description: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
    },
    mobile: {
      type: Sequelize.STRING(10),
    },
    cuisines: {
      type: Sequelize.STRING,
    },
    opening_hours: {
      type: Sequelize.STRING,
    },
    closing_hours: {
      type: Sequelize.STRING,
    },
    price_level: {
      type: Sequelize.STRING,
    },
    rating: {
      type: Sequelize.STRING,
    },
    address: {
      type: Sequelize.STRING,
    },
    city: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    state: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    country: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    latitude: {
      type: Sequelize.DOUBLE,
    },
    longitude: {
      type: Sequelize.DOUBLE,
    },
    location: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    zipcode: {
      type: Sequelize.STRING,
      defaultValue: null,
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
