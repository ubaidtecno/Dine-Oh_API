const express = require("express");
const router = express.Router();

const {
  getAllBanner,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
} = require("../controller/bannerController");

const { auth } = require("../middleware/auth");

router.get("/banners", auth, getAllBanner);

router.get("/banners/:id", auth, getBanner);

router.post("/banners", auth, createBanner);

router.put("/banners/:id", auth, updateBanner);

router.delete("/banners/:id", auth, deleteBanner);

module.exports = router;
