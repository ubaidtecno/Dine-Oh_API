const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "google_restaurants",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING,
    },
    address: {
      type: Sequelize.STRING,
    },
    street_number: {
      type: Sequelize.STRING,
    },
    street_name: {
      type: Sequelize.STRING,
    },
    district: {
      type: Sequelize.STRING,
    },
    city: {
      type: Sequelize.STRING,
    },
    state: {
      type: Sequelize.STRING,
    },
    country: {
      type: Sequelize.STRING,
    },
    zip_code: {
      type: Sequelize.STRING,
    },
    phone_number: {
      type: Sequelize.STRING,
    },
    lat: {
      type: Sequelize.DOUBLE,
    },
    lng: {
      type: Sequelize.DOUBLE,
    },
    place_id: {
      type: Sequelize.STRING,
      unique: true,
    },
    rating: {
      type: Sequelize.DECIMAL(2, 1),
    },
    reference: {
      type: Sequelize.STRING,
    },
    user_ratings_total: {
      type: Sequelize.BIGINT,
    },
    map_url: {
      type: Sequelize.STRING,
    },
    utc_offset: {
      type: Sequelize.BIGINT,
    },
    vicinity: {
      type: Sequelize.STRING,
    },
    website: {
      type: Sequelize.STRING,
    },
    weekday_text: {
      type: Sequelize.TEXT, // Stored as JSON string
      allowNull: true,
      get() {
        const rawValue = this.getDataValue("weekday_text");
        try {
          return JSON.parse(rawValue);
        } catch {
          return [];
        }
      },
      set(value) {
        this.setDataValue("weekday_text", JSON.stringify(value));
      },
    },
    is_verified: {
      type: Sequelize.TINYINT,
    },
  },
  {
    timestamps: 1,
  }
);
