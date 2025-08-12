const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "item",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    s_no: {
      type: Sequelize.BIGINT,
    },
    name: {
      type: Sequelize.STRING,
    },
    description: {
      type: Sequelize.STRING,
    },
    price: {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0,
    },
    restaurant_id: {
      type: Sequelize.BIGINT,
    },
    menu_id: {
      type: Sequelize.BIGINT,
    },
    rating_count: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    special_start: {
      type: Sequelize.DATE,
    },
    special_end: {
      type: Sequelize.DATE,
    },
    rating_avg: {
      type: Sequelize.DOUBLE,
      defaultValue: 0,
    },
    is_veg: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    is_special: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    menu_type: {
      type: Sequelize.STRING,
    },
    ordered_count: {
      type: Sequelize.BIGINT,
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
