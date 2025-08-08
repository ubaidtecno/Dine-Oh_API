const express = require("express");
const router = express.Router();

const {
  Login,
  SignUp,
  getAllInfluencer,
  getInfluencer,
  createInfluencer,
  updateInfluencer,
  deleteInfluencer,
  resetPassword,
  forgotPassword,
  verifyOtp,
  setPassword,
} = require("../controller/influencerController");

const { auth } = require("../middleware/auth");

router.post("/influencers/login", Login);

router.post("/influencers/signup", SignUp);

router.post("/influencers/forgot_password", forgotPassword);

router.post("/influencers/reset_password", resetPassword);

router.post("/influencers/verify_otp", verifyOtp);

router.post("/influencers/set_password", setPassword);

router.get("/influencers", auth, getAllInfluencer);

router.get("/influencers/:id", auth, getInfluencer);

router.post("/influencers", createInfluencer);

router.put("/influencers/:id", auth, updateInfluencer);

router.delete("/influencers/:id", auth, deleteInfluencer);

module.exports = router;
