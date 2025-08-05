const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "google_restaurant_reviews",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    author_name: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    author_url: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    language: {
      type: Sequelize.STRING(10),
      allowNull: true,
    },
    profile_photo_url: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    rating: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    relative_time_description: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    text: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    time: {
      type: Sequelize.BIGINT, // Unix timestamp
      allowNull: true,
    },
    google_restaurant_id: {
      type: Sequelize.BIGINT,
    },
  },
  {
    timestamps: 1,
  }
);
