const express = require("express");
const router = express.Router();

const {
  resLogin,
  resSignUp,
  getAllRestaurantOwner,
  getRestaurantOwner,
  createRestaurantOwner,
  updateRestaurantOwner,
  deleteRestaurantOwner,
  resetPassword,
  forgotPassword,
  verifyOtp,
  setPassword,
} = require("../controller/restaurantOwnerController");

const { auth } = require("../middleware/auth");

router.post("/restaurant_profile/login", resLogin);

router.post("/restaurant_profile/signup", resSignUp);

router.post("/restaurant_profile/forgot_password", forgotPassword);

router.post("/restaurant_profile/reset_password", resetPassword);

router.post("/restaurant_profile/verify_otp", verifyOtp);

router.post("/restaurant_profile/set_password", setPassword);

router.get("/restaurant_profile",  getAllRestaurantOwner);

router.get("/restaurant_profile/:id", getRestaurantOwner);

router.post("/restaurant_profile", createRestaurantOwner);

router.put("/restaurant_profile/:id", updateRestaurantOwner);

router.delete("/restaurant_profile/:id", deleteRestaurantOwner);

module.exports = router;
