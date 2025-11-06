const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "table_bookings",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    restaurant_id: {
      type: Sequelize.BIGINT,
    },
    table_id: {
      type: Sequelize.BIGINT,
    },
    customer_id: {
      type: Sequelize.BIGINT,
    },
    slot_id: {
      type: Sequelize.BIGINT,
    },
    booking_date: {
      type: Sequelize.STRING,
    },
    booking_start_time: {
      type: Sequelize.STRING,
    },
    booking_end_time: {
      type: Sequelize.STRING,
    },
    guest_count: {
      type: Sequelize.INTEGER,
    },
    status: {
      type: Sequelize.ENUM("pending", "confirmed", "completed", "cancelled"),
      defaultValue: "pending",
    },
    special_request: {
      type: Sequelize.TEXT,
    },
    // [FK -> users.id]  -- staff/admin who created the booking
    created_by: {
      type: Sequelize.BIGINT,
    },
    //  [FK -> users.id],
    updated_by: {
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
