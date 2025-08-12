const express = require("express");
const router = express.Router();

const {
  getAllItemTypes,
  getItemType,
  createItemType,
  updateItemType,
  deleteItemType,
} = require("../../controller/itemTypeController");

const { auth } = require("../../middleware/auth");

router.get("/item_types", auth, getAllItemTypes);

router.get("/item_types/:id", auth, getItemType);

router.post("/item_types", auth, createItemType);

router.put("/item_types/:id", auth, updateItemType);

router.delete("/item_types/:id", auth, deleteItemType);

module.exports = router;
