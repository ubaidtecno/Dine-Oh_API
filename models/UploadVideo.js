const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "upload_video",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    restaurant_owner_id: {
      type: Sequelize.BIGINT,
      unique: true,
    },
    restaurant_id: {
      type: Sequelize.BIGINT,
      unique: true,
    },
    influencer_id: {
      type: Sequelize.BIGINT,
      unique: true,
    },
    title: {
      type: Sequelize.STRING,
    },
    description: {
      type: Sequelize.STRING,
    },
    url: {
      type: Sequelize.STRING,
    },
    is_youtube: {
      type: Sequelize.TINYINT,
    },
    is_instagram: {
      type: Sequelize.TINYINT,
    },
    is_own: {
      type: Sequelize.TINYINT,
    },
  },
  {
    timestamps: 1,
  }
);
