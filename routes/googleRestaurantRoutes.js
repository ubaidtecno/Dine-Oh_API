const express = require("express");
const router = express.Router();

const {
  googleSingleRestaurantByPlaceID,
  getAllGoogleRestaurant,
  googleRestaurantPlaces,
  getGoogleRestaurant,
} = require("../controller/googleRestaurantController");

router.get("/google_restaurants", getAllGoogleRestaurant);

router.get("/google_restaurants/:id", getGoogleRestaurant);

router.post("/google_restaurants", googleSingleRestaurantByPlaceID);

router.post("/google_bulk_restaurants", googleRestaurantPlaces);

module.exports = router;
