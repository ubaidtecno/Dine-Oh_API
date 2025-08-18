const express = require("express");
const router = express.Router();

const {
  getAllFavourites,
  getFavourite,
  createFavourite,
  updateFavourite,
  deleteFavourite,
} = require("../controller/favouriteController");

const { auth } = require("../middleware/auth");

router.get("/favourites", auth, getAllFavourites);

router.get("/favourites/:id", auth, getFavourite);

router.post("/favourites", auth, createFavourite);

router.put("/favourites/:id", auth, updateFavourite);

router.delete("/favourites/:id", auth, deleteFavourite);

module.exports = router;
