const express = require("express");
const router = express.Router();

const {
  getAllRestaurant,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} = require("../controller/restaurantContrller");

const { auth } = require("../middleware/auth");

router.get("/restaurants", auth, getAllRestaurant);

router.get("/restaurants/:id", auth, getRestaurant);

router.post("/restaurants", auth, createRestaurant);

router.put("/restaurants/:id", auth, updateRestaurant);

router.delete("/restaurants/:id", auth, deleteRestaurant);

module.exports = router;
