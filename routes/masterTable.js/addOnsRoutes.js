const express = require("express");
const router = express.Router();

const {
  getAllAddOns,
  getAddOn,
  createAddOn,
  updateAddOn,
  deleteAddOn,
} = require("../../controller/addOnsController");

const { auth } = require("../../middleware/auth");

router.get("/addons", auth, getAllAddOns);

router.get("/addons/:id", auth, getAddOn);

router.post("/addons", auth, createAddOn);

router.put("/addons/:id", auth, updateAddOn);

router.delete("/addons/:id", auth, deleteAddOn);

module.exports = router;
