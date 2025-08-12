const express = require("express");
const router = express.Router();

const {
  getAllAttributes,
  getAttribute,
  createAttribute,
  updateAttribute,
  deleteAttribute,
} = require("../../controller/attributeController");

const { auth } = require("../../middleware/auth");

router.get("/attributes", auth, getAllAttributes);

router.get("/attributes/:id", auth, getAttribute);

router.post("/attributes", auth, createAttribute);

router.put("/attributes/:id", auth, updateAttribute);

router.delete("/attributes/:id", auth, deleteAttribute);

module.exports = router;
