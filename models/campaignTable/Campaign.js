const Sequelize = require("sequelize");
const db = require("../../config/db");

module.exports = db.sequelize.define(
  "campaign",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    restaurant_owner_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
    },
    cuisine: {
      type: Sequelize.STRING,
    },
    location: {
      type: Sequelize.STRING,
    },
    payment_type: {
      type: Sequelize.ENUM("paid", "in-kind"),
      allowNull: true,
    },
    fee: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    },
    in_kind_details: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    min_followers: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    max_followers: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    requirements: {
      type: Sequelize.TEXT,
    },
    start_date: {
      type: Sequelize.STRING,
    },
    end_date: {
      type: Sequelize.STRING,
    },
    status: {
      type: Sequelize.ENUM("draft", "published", "closed"),
      defaultValue: "published",
    },
    category: {
      type: Sequelize.STRING, // e.g., "food", "travel", "lifestyle"
    },
  },
  {
    timestamps: 1,
  }
);
