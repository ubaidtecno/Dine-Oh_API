const { Router } = require("express");
const router = Router();

const attach = require("./attachRoutes");
const authRoutes = require("./authRoutes");
const googleRestaurant = require("./googleRestaurantRoutes");
const influencer = require("./influencerRoutes");
const restaurant = require("./restaurantRoutes");
const restaurantOwner = require("./restaurant_ownerRoutes");
const roles = require("./rolesRoutes");

// Use Routes
router.use(
  attach,
  authRoutes,
  googleRestaurant,
  influencer,
  restaurant,
  restaurantOwner,
  roles
);

module.exports = router;
