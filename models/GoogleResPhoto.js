const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "google_restaurant_photos",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    height: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    width: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    photo_reference: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    html_attributions: {
      type: Sequelize.TEXT, // store as JSON string
      get() {
        const val = this.getDataValue("html_attributions");
        try {
          return JSON.parse(val);
        } catch {
          return val; // fallback if not JSON
        }
      },
      set(value) {
        if (Array.isArray(value)) {
          this.setDataValue("html_attributions", JSON.stringify(value));
        } else {
          this.setDataValue("html_attributions", value);
        }
      },
    },
    google_restaurant_id: {
      type: Sequelize.BIGINT,
    },
  },
  {
    timestamps: 1,
  }
);
