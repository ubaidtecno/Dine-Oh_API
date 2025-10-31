const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// load models
const {
  UploadVideo,
  Attach,
  Restaurant,
  RestaurantOwner,
  Influencer,
  CampaignParticipation,
} = require("../models");
const resjson = require("../core/resjson");
const attach = require("../controller/attachController");

// get all Deal
let getAllUploadVideo = async (req, res) => {
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
        model: Restaurant,
        required: false,
      },
      {
        model: RestaurantOwner,
        required: false,
      },
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
        model: Attach,
        as: "videos",
        where: { class: "Video" },
        required: false,
      },
      {
        model: CampaignParticipation,
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
            { title: { [Op.like]: `%${searchString}%` } },
          ],
        },
      ],
    };
  }

  try {
    let videos = await UploadVideo.findAndCountAll(obj);
    return res.json(resjson(videos, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// Retrieve single
const getUploadVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await UploadVideo.findOne({
      where: { id },
      include: [
        {
          model: Restaurant,
          required: false,
        },
        {
          model: RestaurantOwner,
          required: false,
        },
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
          model: Attach,
          as: "videos",
          where: { class: "Video" },
          required: false,
        },
        {
          model: CampaignParticipation,
          required: false,
        },
      ],
    });

    if (!video) {
      return res.status(404).json(resjson("", "Video not found", "", 1));
    }

    return res.json(resjson(video, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// create UploadVideo
let createUploadVideo = async (req, res) => {
  try {
    // Upsert will either insert or update based on restaurant_id unique constraint
    const [newUploadVideo, created] = await UploadVideo.upsert(req.body, {
      returning: true, // ensures we get the updated row back
    });

    if (
      req.body.video !== undefined &&
      req.body.video !== null &&
      req.body.video.length > 0
    ) {
      let isStored = await attach.multiFileStore(
        "Video",
        req.body.video,
        newUploadVideo.id,
        false
      );
    }

    return res.json(
      resjson(
        newUploadVideo,
        created ? "Video was created" : "Video was updated",
        ""
      )
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

/* 
Review video and verify	
The Restaurant owner will review the content and give approval to post it on social media.
JSON 
{
  "approval_status": "approved",
  "approval_comment": "Video is amazing man",
  "approved_restaurant_owner_id": 8
}
*/
// update UploadVideo
let updateUploadVideo = async (req, res) => {
  const { id } = req.params;

  try {
    // Update main video record
    const [result] = await UploadVideo.update(req.body, {
      where: { id },
    });

    // Handle attachments if provided
    if (req.body.video && req.body.video.length > 0) {
      await attach.multiFileStore("Video", req.body.video, id, false);
    }

    if (result > 0) {
      // Fetch updated record with attachments
      const video = await UploadVideo.findOne({
        where: { id },
        include: [
          {
            model: Attach,
            as: "videos", // ✅ make sure this alias matches your association
            where: { class: "Video" },
            required: false, // ✅ required:false ensures you still get record even if no attach
          },
        ],
      });

      return res.json(resjson(video, "Video was updated", ""));
    } else {
      return res.status(404).json(resjson("", "Video not found", "", 1));
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// delete UploadVideo
let deleteUploadVideo = async (req, res) => {
  try {
    const { id } = req.params;

    const video = await UploadVideo.findByPk(id);

    if (!video) {
      return res.status(404).json(resjson("", "Video not found", "", 1));
    }

    await Attach.destroy({
      where: {
        class: ["Video"],
        foreign_id: id,
      },
    });

    const resp = await UploadVideo.destroy({ where: { id } });

    return res.json(resjson(resp, "Video was deleted", "", 0));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

module.exports = {
  getAllUploadVideo,
  getUploadVideo,
  createUploadVideo,
  updateUploadVideo,
  deleteUploadVideo,
};
