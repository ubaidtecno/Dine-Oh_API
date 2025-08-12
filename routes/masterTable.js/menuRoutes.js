const express = require("express");
const router = express.Router();

const {
  getAllMenus,
  getMenu,
  createMenu,
  updateMenu,
  deleteMenu,
} = require("../../controller/menuController");

const { auth } = require("../../middleware/auth");

router.get("/menus", auth, getAllMenus);

router.get("/menus/:id", auth, getMenu);

router.post("/menus", createMenu);

router.put("/menus/:id", auth, updateMenu);

router.delete("/menus/:id", auth, deleteMenu);

module.exports = router;
