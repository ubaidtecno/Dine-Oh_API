const express = require("express");
const router = express.Router();

const {
  reviewStats,
  getAllRestaurantReview,
  getSingleReview,
  createRestaurantReview,
  updateRestaurantReview,
  deleteRestaurantReview,
  getReviewForSingleRestaurant,
  getReviewRatingBasedOnRestaurant,
  getAllReview,
} = require("../controller/reviewController");

const { auth } = require("../middleware/auth");

router.get("/reviews/stats", auth, reviewStats);

router.get("/reviews", auth, getAllReview);

router.get("/review/restaurants", getReviewRatingBasedOnRestaurant);

router.get("/reviews_for_all_restaurant", auth, getAllRestaurantReview);

router.get(
  "/reviews_for_single_restaurant/:id",
  auth,
  getReviewForSingleRestaurant
);

router.get("/reviews/:id", auth, getSingleReview);

router.post("/reviews", auth, createRestaurantReview);

router.put("/reviews/:id", auth, updateRestaurantReview);

router.delete("/reviews/:id", auth, deleteRestaurantReview);

module.exports = router;
