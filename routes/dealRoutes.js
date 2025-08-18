const express = require("express");
const router = express.Router();

const {
  getAllDeal,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
} = require("../controller/dealController");

const { auth } = require("../middleware/auth");

router.get("/deals", getAllDeal);

router.get("/deals/:id", auth, getDeal);

router.post("/deals", auth, createDeal);

router.put("/deals/:id", auth, updateDeal);

router.delete("/deals/:id", auth, deleteDeal);

module.exports = router;
