const express = require("express");
const router = express.Router();

const {
  getAllTableBookings,
  getTableBooking,
  createTableBooking,
  updateTableBooking,
  deleteTableBooking,
} = require("../controller/tableBookingController");

const { auth } = require("../middleware/auth");

router.get("/table_bookings", auth, getAllTableBookings);

router.get("/table_bookings/:id", auth, getTableBooking);

router.post("/table_bookings", auth, createTableBooking);

router.put("/table_bookings/:id", auth, updateTableBooking);

router.delete("/table_bookings/:id", auth, deleteTableBooking);

module.exports = router;
