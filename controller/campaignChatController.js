const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// Load models
const { CampaignChat, Campaign } = require("../models");
const resjson = require("../core/resjson");
const Notification = require("../models/Notification");
const push = require("../core/pushNotification");

let getAllCampaignChats = async (req, res) => {
  let filter = req.query.filter;
  filter === undefined
    ? (filter = "")
    : (filter = JSON.parse(req.query.filter));

  let limit = req.query.limit ? parseInt(req.query.limit) : req.query.limit;
  let offset = req.query.offset ? parseInt(req.query.offset) : req.query.offset;
  let searchString = req.query.searchString ? req.query.searchString : "";
  let searchField = req.query.searchField ? req.query.searchField : "";

  let sortField = req.query.sortField ? req.query.sortField : "createdAt";
  let sortOrder = req.query.sortField ? req.query.sortOrder : "ASC";

  let obj = {
    where: filter.where,
    order: [[`${sortField}`, `${sortOrder}`]],
    limit,
    offset,
    distinct: true,
  };

  if (searchField !== "" && searchField != null && searchField != undefined) {
    switch (searchField) {
      case "id":
        obj.where = {
          [Op.and]: [filter.where, { id: { [Op.like]: `${searchString}%` } }],
        };
        break;

      case "name":
        obj.where = {
          [Op.and]: [
            filter.where,
            { name: { [Op.like]: `%${searchString}%` } },
          ],
        };
        break;
    }
  } else if (
    searchString !== "" &&
    searchString != null &&
    searchString != undefined
  ) {
    obj.where = {
      [Op.and]: [
        filter.where,
        {
          [Op.or]: [
            { id: { [Op.like]: `%${searchString}%` } },
            { name: { [Op.like]: `%${searchString}%` } },
          ],
        },
      ],
    };
  }

  try {
    let campaignChats = await CampaignChat.findAndCountAll(obj);
    return res.json(resjson(campaignChats, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// Retrieve single
const getCampaignChat = async (req, res) => {
  try {
    const { id } = req.params;
    const campaignChat = await CampaignChat.findOne({
      where: { id },
    });

    if (!campaignChat) {
      return res.status(404).json(resjson("", "Chat not found", "", 1));
    }

    return res.json(resjson(campaignChat, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let createCampaignChat = async (req, res) => {
  try {
    const newCampaignChat = await CampaignChat.create(req.body);

    return res.json(resjson(newCampaignChat, "Chat was created", ""));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let updateCampaignChat = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await CampaignChat.update(req.body, {
      where: { id },
    });

    if (result > 0) {
      const campaignChat = await CampaignChat.findOne({
        where: { id },
      });

      return res.json(resjson(campaignChat, "Chat was updated", ""));
    } else {
      return res.status(404).json(resjson("", "Chat not found", "", 1));
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let deleteCampaignChat = async (req, res) => {
  try {
    const { id } = req.params;

    const campaignChat = await CampaignChat.findByPk(id);

    if (!campaignChat) {
      return res.status(404).json(resjson("", "Chat not found", "", 1));
    }
    await CampaignChat.destroy({ where: { id } });

    return res.json(resjson("", "Chat was deleted", "", 0));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let sendMessage = async (req, res) => {
  try {
    const {
      campaign_id,
      restaurant_owner_id,
      influencer_id,
      sender_type,
      message,
    } = req.body;

    // Validate campaign
    const campaign = await Campaign.findByPk(campaign_id);
    if (!campaign) {
      return res.status(404).json(resjson("", "Campaign not found", "", 1));
    }

    // Save chat message
    let chatMsg = await CampaignChat.create({
      campaign_id,
      restaurant_owner_id,
      influencer_id,
      sender_type,
      message,
    });

    // Decide receiver
    let receiverType =
      sender_type === "influencer" ? "restaurant_owner" : "influencer";
    let receiverId =
      sender_type === "influencer" ? restaurant_owner_id : influencer_id;

    // Create notification
    let notification = await Notification.create({
      description: message,
      title: "New campaign chat message",
      type: "campaign_chat",
      restaurant_owner_id,
      influencer_id,
    });

    if (notification) {
      push.notificationToParticularUserId(
        receiverId, // ✅ actual receiver id
        receiverType, // ✅ so we know which table to check
        {
          title: notification.title,
          body: notification.description,
        },
        {
          id: chatMsg.id,
          type: notification.type,
        }
      );
    }

    return res.json(resjson(chatMsg, "Message sent successfully", "", 0));
  } catch (err) {
    console.log(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// ✅ Get conversation thread
let getConversation = async (req, res) => {
  try {
    const { campaign_id, restaurant_owner_id, influencer_id } = req.query;

    let messages = await CampaignChat.findAll({
      where: { campaign_id, restaurant_owner_id, influencer_id },
      order: [["createdAt", "ASC"]],
    });

    return res.json(
      resjson(messages, "Conversation fetched successfully", "", 0)
    );
  } catch (err) {
    console.log(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

module.exports = {
  getAllCampaignChats,
  getCampaignChat,
  createCampaignChat,
  updateCampaignChat,
  deleteCampaignChat,
  sendMessage,
};
