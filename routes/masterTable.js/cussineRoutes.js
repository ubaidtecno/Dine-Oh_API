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

router.get("/cussines", auth, getAllCussines);

router.get("/cussines/:id", auth, getCussine);

router.post("/cussines", auth, createCussine);

router.put("/cussines/:id", auth, updateCussine);

router.delete("/cussines/:id", auth, deleteCussine);

module.exports = router;
