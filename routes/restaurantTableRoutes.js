const express = require("express");
const router = express.Router();

const {
  getAllRestaurantTable,
  getRestaurantTable,
  createRestaurantTable,
  updateRestaurantTable,
  deleteRestaurantTable,
} = require("../controller/restaurantTableController");

const { auth } = require("../middleware/auth");

router.get("/restaurant_tables", auth, getAllRestaurantTable);

router.get("/restaurant_tables/:id", auth, getRestaurantTable);

router.post("/restaurant_tables", createRestaurantTable);

router.put("/restaurant_tables/:id", auth, updateRestaurantTable);

router.delete("/restaurant_tables/:id", auth, deleteRestaurantTable);

module.exports = router;
