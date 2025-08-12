const express = require("express");
const router = express.Router();

const {
  getAllItem,
  getSingleItem,
  createItem,
  updateItem,
  deleteItem,
} = require("../controller/itemController");

const { auth } = require("../middleware/auth");

router.get("/items", auth, getAllItem);

router.get("/items/:id", auth, getSingleItem);

router.post("/items", auth, createItem);

router.put("/items/:id", auth, updateItem);

router.delete("/items/:id", auth, deleteItem);

module.exports = router;
