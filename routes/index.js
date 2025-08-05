const { Router } = require("express");
const router = Router();

const authRoutes = require("./authRoutes");
const restaurant = require("./restaurantRoutes");
const googleRestaurant = require("./googleRestaurantRoutes");
const attach = require("./attachRoutes");

// Use Routes
router.use(authRoutes, restaurant, googleRestaurant, attach);

module.exports = router;
