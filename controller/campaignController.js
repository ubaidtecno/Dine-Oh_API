const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const jwt = require("jsonwebtoken");

// Load models
const {
  Campaign,
  CampaignParticipation,
  Attach,
  RestaurantOwner,
  Influencer,
  Favourite,
  UploadVideo,
} = require("../models");
const resjson = require("../core/resjson");
const { sequelize } = require("../config/db");
const attach = require("../controller/attachController");

// List of user
let getAllCampaign = async (req, res) => {
  let filter = req.query.filter;
  filter === undefined
    ? (filter = "")
    : (filter = JSON.parse(req.query.filter));

  let limit = req.query.limit ? parseInt(req.query.limit) : req.query.limit;
  let offset = req.query.offset ? parseInt(req.query.offset) : req.query.offset;
  let searchString = req.query.searchString ? req.query.searchString : "";
  let searchField = req.query.searchField ? req.query.searchField : "";

  let sortField = req.query.sortField ? req.query.sortField : "id";
  let sortOrder = req.query.sortField ? req.query.sortOrder : "ASC";

  let obj = {
    where: filter.where,
    include: [
      {
        model: CampaignParticipation,
        where: filter.inCampaignParticipation,
        required: false,
        include: [
          {
            model: Influencer,
            required: false,
            attributes: {
              exclude: [
                "password",
                "provider",
                "access_token",
                "refresh_token",
                "expiry_date",
                "device_token",
                "last_otp",
              ],
            },
          },
          {
            model: UploadVideo,
            required: false,
            include: [
              {
                model: Attach,
                as: "videos",
                where: { class: "Video" },
                required: false,
              },
            ],
          },
          {
            model: Attach,
            where: { class: "Campaign_Participation_Photo" },
            as: "campaign_participation_photos",
            required: false,
          },
        ],
      },
      {
        model: Attach,
        where: { class: "Campaign_Photo" },
        as: "campaign_photos",
        required: false,
      },
    ],
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

      case "title":
        obj.where = {
          [Op.and]: [
            filter.where,
            { title: { [Op.like]: `%${searchString}%` } },
          ],
        };
        break;
      case "cuisine":
        obj.where = {
          [Op.and]: [
            filter.where,
            { cuisine: { [Op.like]: `%${searchString}%` } },
          ],
        };
        break;
      case "location":
        obj.where = {
          [Op.and]: [
            filter.where,
            { location: { [Op.like]: `%${searchString}%` } },
          ],
        };
        break;
      case "payment_type":
        obj.where = {
          [Op.and]: [
            filter.where,
            { payment_type: { [Op.like]: `%${searchString}%` } },
          ],
        };
        break;
      case "min_followers":
        obj.where = {
          [Op.and]: [
            filter.where,
            { min_followers: { [Op.like]: `%${searchString}%` } },
          ],
        };
        break;
      case "max_followers":
        obj.where = {
          [Op.and]: [
            filter.where,
            { max_followers: { [Op.like]: `%${searchString}%` } },
          ],
        };
        break;
      case "fee":
        obj.where = {
          [Op.and]: [filter.where, { fee: { [Op.like]: `%${searchString}%` } }],
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
            { title: { [Op.like]: `%${searchString}%` } },
            { cuisine: { [Op.like]: `%${searchString}%` } },
            { location: { [Op.like]: `%${searchString}%` } },
            { payment_type: { [Op.like]: `%${searchString}%` } },
            { min_followers: { [Op.like]: `%${searchString}%` } },
            { max_followers: { [Op.like]: `%${searchString}%` } },
            { fee: { [Op.like]: `%${searchString}%` } },
          ],
        },
      ],
    };
  }

  await Campaign.findAndCountAll(obj)
    .then((resp) => {
      return res.json(resjson(resp, "", "", 0));
    })
    .catch((err) => {
      console.log(err);
    });
};

let getAllCampaignForInfluencer = async (req, res) => {
  let userDataFromRequest = req.user;
  let userId = userDataFromRequest.id;

  let filter = req.query.filter;
  filter === undefined
    ? (filter = "")
    : (filter = JSON.parse(req.query.filter));

  let limit = req.query.limit ? parseInt(req.query.limit) : req.query.limit;
  let offset = req.query.offset ? parseInt(req.query.offset) : req.query.offset;
  let searchString = req.query.searchString ? req.query.searchString : "";
  let searchField = req.query.searchField ? req.query.searchField : "";

  let sortField = req.query.sortField ? req.query.sortField : "id";
  let sortOrder = req.query.sortField ? req.query.sortOrder : "ASC";

  let obj = {
    where: filter.where,
    include: [
      {
        model: CampaignParticipation,
        required: false,
        where: { influencer_id: userId },
        include: [
          {
            model: Influencer,
            required: false,
            attributes: {
              exclude: [
                "password",
                "provider",
                "access_token",
                "refresh_token",
                "expiry_date",
                "device_token",
                "last_otp",
              ],
            },
          },
          {
            model: UploadVideo,
            required: false,
            include: [
              {
                model: Attach,
                as: "videos",
                where: { class: "Video" },
                required: false,
              },
            ],
          },
        ],
      },
      {
        model: Attach,
        where: { class: "Campaign_Photo" },
        as: "campaign_photos",
        required: false,
      },
      {
        model: Favourite,
        required: false,
        where: { class: "Campaign", user_id: userId },
      },
    ],
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

      case "title":
        obj.where = {
          [Op.and]: [
            filter.where,
            { title: { [Op.like]: `%${searchString}%` } },
          ],
        };
        break;
      case "cuisine":
        obj.where = {
          [Op.and]: [
            filter.where,
            { cuisine: { [Op.like]: `%${searchString}%` } },
          ],
        };
        break;
      case "location":
        obj.where = {
          [Op.and]: [
            filter.where,
            { location: { [Op.like]: `%${searchString}%` } },
          ],
        };
        break;
      case "payment_type":
        obj.where = {
          [Op.and]: [
            filter.where,
            { payment_type: { [Op.like]: `%${searchString}%` } },
          ],
        };
        break;
      case "min_followers":
        obj.where = {
          [Op.and]: [
            filter.where,
            { min_followers: { [Op.like]: `%${searchString}%` } },
          ],
        };
        break;
      case "max_followers":
        obj.where = {
          [Op.and]: [
            filter.where,
            { max_followers: { [Op.like]: `%${searchString}%` } },
          ],
        };
        break;
      case "fee":
        obj.where = {
          [Op.and]: [filter.where, { fee: { [Op.like]: `%${searchString}%` } }],
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
            { title: { [Op.like]: `%${searchString}%` } },
            { cuisine: { [Op.like]: `%${searchString}%` } },
            { location: { [Op.like]: `%${searchString}%` } },
            { payment_type: { [Op.like]: `%${searchString}%` } },
            { min_followers: { [Op.like]: `%${searchString}%` } },
            { max_followers: { [Op.like]: `%${searchString}%` } },
            { fee: { [Op.like]: `%${searchString}%` } },
          ],
        },
      ],
    };
  }

  await Campaign.findAndCountAll(obj)
    .then((resp) => {
      return res.json(resjson(resp, "", "", 0));
    })
    .catch((err) => {
      console.log(err);
    });
};

const getCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findOne({
      where: { id },
      include: [
        {
          model: CampaignParticipation,
          required: false,
          include: [
            {
              model: Influencer,
              required: false,
              attributes: {
                exclude: [
                  "password",
                  "provider",
                  "access_token",
                  "refresh_token",
                  "expiry_date",
                  "device_token",
                  "last_otp",
                ],
              },
            },
            {
              model: UploadVideo,
              required: false,
              include: [
                {
                  model: Attach,
                  as: "videos",
                  where: { class: "Video" },
                  required: false,
                },
              ],
            },
            {
              model: Attach,
              where: { class: "Campaign_Participation_Photo" },
              as: "campaign_participation_photos",
              required: false,
            },
          ],
        },
        {
          model: Attach,
          where: { class: "Campaign_Photo" },
          as: "campaign_photos",
          required: false,
        },
      ],
    });

    if (!campaign) {
      return res.status(404).json(resjson("", "Campaign not found", "", 1));
    }

    return res.json(resjson(campaign, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let createCampaign = async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction(); // Start a transaction

    const { restaurant_owner_id } = req.body;

    const owner = await RestaurantOwner.findOne({
      where: { id: restaurant_owner_id },
    });

    if (!owner) {
      return res
        .status(404)
        .json(resjson("", "Restaurant owner not found", "", 1));
    }

    let newCampaign = await Campaign.create(req.body, { transaction });

    // Commit the transaction if the Campaign creation was successful
    await transaction.commit();

    if (
      req.body.photos !== undefined &&
      req.body.photos !== null &&
      req.body.photos.length > 0
    ) {
      let isStored = await attach.multiFileStore(
        "Campaign_Photo",
        req.body.photos,
        newCampaign.id,
        false
      );
    }

    // Fetch the created Campaign along with associated Campaign Participation details
    newCampaign = await Campaign.findByPk(newCampaign.id, {
      include: [
        // {
        //   model: CampaignParticipation,
        //   required: false,
        // },

        {
          model: Attach,
          where: { class: "Campaign_Photo" },
          as: "campaign_photos",
          required: false,
        },
      ],
    });

    return res.json(
      resjson(newCampaign, "Campaign Created Successfully", "", 0)
    );
  } catch (err) {
    console.log({ err });
    if (transaction) {
      await transaction.rollback(); // Rollback the transaction in case of an error
    }
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// influencer applies for a campaign
let applyForCampaign = async (req, res) => {
  try {
    const { campaign_id, message, influencer_id } = req.body;

    // check campaign exists
    const campaign = await Campaign.findByPk(campaign_id);
    if (!campaign) {
      return res.status(404).json(resjson("", "Campaign not found", "", 1));
    }

    // check influencer exists
    const influencer = await Influencer.findByPk(influencer_id);
    if (!influencer) {
      return res.status(404).json(resjson("", "Influencer not found", "", 1));
    }

    // prevent duplicate application
    const existing = await CampaignParticipation.findOne({
      where: { campaign_id, influencer_id, type: "application" },
    });
    if (existing) {
      return res
        .status(409)
        .json(resjson("", "Already applied to this campaign", "", 1));
    }

    const participation = await CampaignParticipation.create({
      campaign_id,
      influencer_id,
      type: "application",
      message,
      status: "pending",
    });

    return res.json(resjson(participation, "Application submitted", "", 0));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// restaurant owner invites an influencer
let inviteInfluencer = async (req, res) => {
  try {
    const { campaign_id, influencer_id, message, restaurant_owner_id } =
      req.body;

    const owner = await RestaurantOwner.findOne({
      where: { id: restaurant_owner_id },
    });

    if (!owner) {
      return res
        .status(404)
        .json(resjson("", "Restaurant owner not found", "", 1));
    }

    // verify ownership
    const campaign = await Campaign.findOne({
      where: { id: campaign_id, restaurant_owner_id },
    });
    if (!campaign) {
      return res
        .status(403)
        .json(
          resjson("", "You are not allowed to invite for this campaign", "", 1)
        );
    }

    // prevent duplicate invite
    const existing = await CampaignParticipation.findOne({
      where: { campaign_id, influencer_id, type: "invite" },
    });
    if (existing) {
      return res
        .status(409)
        .json(resjson("", "Influencer already invited", "", 1));
    }

    const participation = await CampaignParticipation.create({
      campaign_id,
      influencer_id,
      type: "invite",
      message,
      status: "pending",
    });

    return res.json(
      resjson(participation, "Influencer invited successfully", "", 0)
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let updateCampaign = async (req, res) => {
  const { id } = req.params;
  let transaction;

  try {
    transaction = await sequelize.transaction(); // Start a transaction

    // Update the Campaign
    await Campaign.update(req.body, {
      where: { id },
      transaction,
    });

    // Delete and create associated CampaignParticipation details
    // await deleteAndCreateDetails(
    //   CampaignParticipation,
    //   req.body.campaign_participation,
    //   id,
    //   transaction
    // );

    // Handle photos update logic
    if (
      req.body.photos !== undefined &&
      req.body.photos !== null &&
      req.body.photos.length > 0
    ) {
      let isStored = await attach.multiFileStore(
        "Campaign_Photo",
        req.body.photos,
        id,
        true
      );
    }

    await transaction.commit();

    // Fetch the updated Campaign along with its associated CampaignParticipation details
    const updatedCampaign = await Campaign.findByPk(id, {
      include: [
        // {
        //   model: CampaignParticipation,
        //   required: false,
        // },

        {
          model: Attach,
          where: { class: "Campaign_Photo" },
          as: "campaign_photos",
          required: false,
        },
      ],
    });

    return res.json(
      resjson(updatedCampaign, "Campaign Updated Successfully", "", 0)
    );
  } catch (err) {
    console.error(err);
    await transaction.rollback(); // Rollback the transaction in case of an error
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

const getCampaignParticipation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await CampaignParticipation.findOne({
      where: { id },
      include: [
        {
          model: Influencer,
          required: false,
          attributes: {
            exclude: [
              "password",
              "provider",
              "access_token",
              "refresh_token",
              "expiry_date",
              "device_token",
              "last_otp",
            ],
          },
        },
        {
          model: UploadVideo,
          required: false,
          include: [
            {
              model: Attach,
              as: "videos",
              where: { class: "Video" },
              required: false,
            },
          ],
        },
        {
          model: Attach,
          where: { class: "Campaign_Participation_Photo" },
          as: "campaign_participation_photos",
          required: false,
        },
      ],
    });

    if (!campaign) {
      return res
        .status(404)
        .json(resjson("", "Campaign Participation not found", "", 1));
    }

    return res.json(resjson(campaign, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// update paticipants with photos or attachments if needed
let updateCampaignParticipation = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await CampaignParticipation.update(req.body, {
      where: { id },
    });

    // Handle photos update logic
    if (
      req.body.photos !== undefined &&
      req.body.photos !== null &&
      req.body.photos.length > 0
    ) {
      let isStored = await attach.multiFileStore(
        "Campaign_Participation_Photo",
        req.body.photos,
        id,
        false
      );
    }

    if (result > 0) {
      const data = await CampaignParticipation.findOne({
        where: { id },
        include: [
          {
            model: Attach,
            where: { class: "Campaign_Participation_Photo" },
            as: "campaign_participation_photos",
            required: false,
          },
        ],
      });
      if (data?.status !== "") {
        return res.json(resjson(data, "Updated successfully", ""));
      } else {
        return res.json(resjson("", "Please check the status correctly", ""));
      }
    } else {
      return res.status(404).json(resjson("", "Record not found", "", 1));
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

const deleteCampaignParticipation = async (req, res) => {
  try {
    const { id } = req.params;

    const resp = await CampaignParticipation.destroy({
      where: { id },
    }).catch((err) => {
      console.log(err);
      return res.status(422).json(resjson("", "Something Went wrong", "", 1));
    });

    if (resp === 0) {
      return res
        .status(404)
        .json(resjson("", "Campaign Participation not found", "", 1));
    }

    return res.json(resjson("", "Campaign Participation was deleted", "", 0));
  } catch (err) {
    console.error(err);
    await transaction.rollback(); // Rollback the transaction in case of an error
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete associated Campaign Participation
    await CampaignParticipation.destroy({ where: { campaign_id: id } }).catch(
      (err) => {
        console.log(err);
        return res.status(422).json(resjson("", "Something Went wrong", "", 1));
      }
    );

    const resp = await Campaign.destroy({ where: { id } });

    if (resp === 0) {
      return res.status(404).json(resjson("", "Campaign not found", "", 1));
    }

    return res.json(resjson("", "Campaign was deleted", "", 0));
  } catch (err) {
    console.error(err);
    await transaction.rollback(); // Rollback the transaction in case of an error
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteAndCreateDetails = async (
  model,
  detailsArray,
  campaignId,
  transaction
) => {
  if (detailsArray && detailsArray.length > 0) {
    // Delete all existing details for the Campaign
    await model.destroy({ where: { campaign_id: campaignId }, transaction });

    // Create new details based on the updated array
    const newDetails = detailsArray.map((detail) => ({
      ...detail,
      campaign_id: campaignId,
    }));

    await model.bulkCreate(newDetails, { transaction });
  }
};

module.exports = {
  getAllCampaign,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  applyForCampaign,
  inviteInfluencer,
  getAllCampaignForInfluencer,
  updateCampaignParticipation,
  deleteCampaignParticipation,
  getCampaignParticipation,
};
