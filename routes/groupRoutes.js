const express = require("express");
const router = express.Router();

const {
  getAllGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  createGroupMember,
} = require("../controller/groupController");

const { auth } = require("../middleware/auth");

router.get("/groups", getAllGroups);

router.get("/groups/:id", auth, getGroup);

router.post("/groups", auth, createGroup);

router.put("/groups/add_members/:id", auth, createGroupMember);

router.put("/groups/:id", auth, updateGroup);

router.delete("/groups/:id", auth, deleteGroup);

module.exports = router;
