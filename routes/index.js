const { Router } = require("express");
const router = Router();

const authRoutes = require("./authRoutes");
const restaurant = require("./restaurantRoutes");
const attach = require("./attachRoutes");

// Use Routes
router.use(authRoutes, restaurant, attach);

module.exports = router;
