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

router.get("/favourites", getAllFavourites);

router.get("/favourites/:id", getFavourite);

router.post("/favourites", createFavourite);

router.put("/favourites/:id", updateFavourite);

router.delete("/favourites/:id", deleteFavourite);

module.exports = router;
