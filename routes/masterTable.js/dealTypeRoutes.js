const express = require("express");
const router = express.Router();

const {
  getAllDealTypes,
  getDealType,
  createDealType,
  updateDealType,
  deleteDealType,
} = require("../../controller/dealTypeController");

const { auth } = require("../../middleware/auth");

router.get("/deal_types", getAllDealTypes);

router.get("/deal_types/:id", auth, getDealType);

router.post("/deal_types", auth, createDealType);

router.put("/deal_types/:id", auth, updateDealType);

router.delete("/deal_types/:id", auth, deleteDealType);

module.exports = router;
