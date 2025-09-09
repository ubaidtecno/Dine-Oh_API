const express = require("express");
const router = express.Router();

const {
  getAllCampaign,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  applyForCampaign,
  inviteInfluencer,
  getAllCampaignForInfluencer,
  updateCampaignParticipation,
} = require("../controller/campaignController");

const { influencerAuth } = require("../middleware/auth");

router.get("/campaigns", getAllCampaign);

router.get(
  "/campaigns_for_influencer",
  influencerAuth,
  getAllCampaignForInfluencer
);

router.get("/campaigns/:id", getCampaign);

router.post("/campaigns", createCampaign);

router.post("/campaigns/apply", applyForCampaign);

router.post("/campaigns/invite", inviteInfluencer);

router.put("/campaigns/:id", updateCampaign);

router.put("/campaign_participations/:id", updateCampaignParticipation);

router.delete("/campaigns/:id", deleteCampaign);

module.exports = router;
