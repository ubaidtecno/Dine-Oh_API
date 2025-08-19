const express = require("express");
const router = express.Router();

const {
  getAllCussines,
  getCussine,
  createCussine,
  updateCussine,
  deleteCussine,
} = require("../../controller/cussineController.js");

const { auth } = require("../../middleware/auth");

router.get("/cuisines", auth, getAllCussines);

router.get("/cuisines/:id", auth, getCussine);

router.post("/cuisines", auth, createCussine);

router.put("/cuisines/:id", auth, updateCussine);

router.delete("/cuisines/:id", auth, deleteCussine);

module.exports = router;
