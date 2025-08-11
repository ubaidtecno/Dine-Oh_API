const { Router } = require("express");
const router = Router();

const authRoutes = require("./authRoutes");
const restaurant = require("./restaurantRoutes");
const review = require("./reviewRoutes");
const googleRestaurant = require("./googleRestaurantRoutes");
const attach = require("./attachRoutes");
const banner = require("./bannerRoutes");
const influencer = require("./influencerRoutes");
const restaurantOwner = require("./restaurant_ownerRoutes");
const roles = require("./rolesRoutes");

// Use Routes
router.use(
  authRoutes,
  restaurant,
  banner,
  influencer,
  restaurantOwner,
  roles,
  review,
  googleRestaurant,
  attach
);

module.exports = router;
