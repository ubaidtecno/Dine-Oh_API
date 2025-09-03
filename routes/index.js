const { Router } = require("express");
const router = Router();

const addOn = require("./masterTable.js/addOnsRoutes");
const attach = require("./attachRoutes");
const attribute = require("./masterTable.js/attributeRoutes");
const authRoutes = require("./authRoutes");
const banner = require("./bannerRoutes");
const cussine = require("./masterTable.js/cussineRoutes");
const dealType = require("./dealRoutes");
const deal = require("./masterTable.js/dealTypeRoutes");
const favourite = require("./favouriteRoutes");
const googleRestaurant = require("./googleRestaurantRoutes");
const group = require("./groupRoutes");
const influencer = require("./influencerRoutes");
const item = require("./itemRoutes");
const ItemType = require("./masterTable.js/itemTypeRoutes");
const menu = require("./masterTable.js/menuRoutes");
const restaurant = require("./restaurantRoutes");
const restaurantOwner = require("./restaurant_ownerRoutes");
const review = require("./reviewRoutes");
const roles = require("./rolesRoutes");
const uploadVideo = require("./uploadVideoRoutes");

// Use Routes
router.use(
  addOn,
  attach,
  attribute,
  authRoutes,
  banner,
  cussine,
  deal,
  dealType,
  favourite,
  googleRestaurant,
  group,
  influencer,
  item,
  ItemType,
  menu,
  restaurant,
  banner,
  influencer,
  restaurantOwner,
  review,
  roles,
  uploadVideo
);

module.exports = router;
