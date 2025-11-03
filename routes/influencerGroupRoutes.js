const express = require("express");
const router = express.Router();

const {
  getAllInfluencerGroup,
  getInfluencerGroup,
  createInfluencerGroup,
  updateInfluencerGroup,
  deleteInfluencerGroup,
  createInfluencerGroupMembers,
  deleteInfluencerGroupMembers,
} = require("../controller/influencerGroupController");

const { auth } = require("../middleware/auth");

router.get("/influencer_groups", auth, getAllInfluencerGroup);

router.get("/influencer_groups/:id", auth, getInfluencerGroup);

router.post("/influencer_groups", auth, createInfluencerGroup);

router.put("/influencer_groups/:id", auth, updateInfluencerGroup);

router.delete("/influencer_groups/:id", auth, deleteInfluencerGroup);

router.post("/influencer_group_members", auth, createInfluencerGroupMembers);

router.delete(
  "/influencer_group_members/:id",
  auth,
  deleteInfluencerGroupMembers
);

module.exports = router;
