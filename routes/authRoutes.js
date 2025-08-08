const express = require("express");
const router = express.Router();

const {
  signUp,
  login,
  adminLogin,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword,
  getUser,
  getAllUser,
  getUserId,
  updateUser,
  deleteUser,
} = require("../controller/authController");

const { auth } = require("../middleware/auth");

router.post("/signup", signUp);
router.post("/login", login);
router.post("/admin/login", adminLogin);
router.post("/forgot_password", forgotPassword);
router.post("/verify_otp", verifyOtp);
router.post("/reset_password", resetPassword);
router.post("/change_password", auth, changePassword);
router.get("/me-user", auth, getUser);

router.get("/users", auth, getAllUser);
router.get("/users/:id", auth, getUserId);
router.put("/users/:id", auth, updateUser);
router.delete("/users/:id", auth, deleteUser);

module.exports = router;
