const express = require("express");
const router = express.Router();

const {
  getAllTableSlot,
  getTableSlot,
  createTableSlot,
  updateTableSlot,
  deleteTableSlot,
} = require("../controller/tableSlotController");

const { auth } = require("../middleware/auth");

router.get("/table_slots", auth, getAllTableSlot);

router.get("/table_slots/:id", getTableSlot);

router.post("/table_slots", createTableSlot);

router.put("/table_slots/:id", auth, updateTableSlot);

router.delete("/table_slots/:id", auth, deleteTableSlot);

module.exports = router;
