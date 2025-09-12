const express = require("express");
const router = express.Router();

const {
  createCampaignChat,
  updateCampaignChat,
  deleteCampaignChat,
  getAllCampaignChats,
  getCampaignChat,
  sendMessage,
} = require("../controller/campaignChatController");

const { auth } = require("../middleware/auth");

router.get("/campaign_chats", getAllCampaignChats);

router.get("/campaign_chats/:id", getCampaignChat);

// router.post("/campaign_chats", createCampaignChat);

router.post("/campaign_chats", sendMessage);

router.put("/campaign_chats/:id", updateCampaignChat);

router.delete("/campaign_chats/:id", deleteCampaignChat);

module.exports = router;
