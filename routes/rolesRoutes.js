const express = require("express");
const router = express.Router();

const {
  getAllRoles,
  getRoles,
  createRoles,
  updateRoles,
  deleteRoles,
} = require("../controller/rolesController");

const { auth } = require("../middleware/auth");

router.get("/roles",auth, getAllRoles);

router.get("/roles/:id",auth, getRoles);

router.post("/roles", auth, createRoles);

router.put("/roles/:id", auth, updateRoles);

router.delete("/roles/:id", auth, deleteRoles);

module.exports = router;
