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
    },
    restaurant_id: {
      type: Sequelize.BIGINT,
    },
    influencer_id: {
      type: Sequelize.BIGINT,
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
