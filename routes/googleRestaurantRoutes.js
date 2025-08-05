const express = require("express");
const router = express.Router();

const {
  googleSingleRestaurantByPlaceID,
  getAllGoogleRestaurant,
  googleRestaurantPlaces,
} = require("../controller/googleRestaurantController");

router.get("/google_restaurants", getAllGoogleRestaurant);

router.post("/google_restaurants", googleSingleRestaurantByPlaceID);

router.post("/google_bulk_restaurants", googleRestaurantPlaces);

module.exports = router;
