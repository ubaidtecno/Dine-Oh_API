const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// load models
const { Banner, Attach } = require("../models");
const resjson = require("../core/resjson");
const attach = require("../controller/attachController");


// get all Banner
let getAllBanner = async (req, res) => {
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
        model: Attach,
        as: "banners",
        where: { class: "Banner" },
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
    let banners = await Banner.findAndCountAll(obj);
    return res.json(resjson(banners, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// Retrieve single
const getBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findOne({
      where: { id },
      include: [
        {
          model: Attach,
          as: "banners",
          where: { class: "Banner" },
          required: false,
        },
      ],
    });

    if (!banner) {
      return res.status(404).json(resjson("", "Banner not found", "", 1));
    }

    return res.json(resjson(banner, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// create Banner
let createBanner = async (req, res) => {
  try {
    const newBanner = await Banner.create(req.body);

    // Attachments for Restaurant
    if (
      req.body.photos !== undefined &&
      req.body.photos !== null &&
      req.body.photos.length > 0
    ) {
      let isStored = await attach.multiFileStore(
        "Banner",
        req.body.photos,
        newBanner.id,
        false
      );
    }

    return res.json(resjson(newBanner, "Banner was created", ""));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// update Banner
let updateBanner = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await Banner.update(req.body, {
      where: { id },
    });

    // Attachments for Profile
    if (
      req.body.photos !== undefined &&
      req.body.photos !== null &&
      req.body.photos.length > 0
    ) {
      let isStored = await attach.multiFileStore(
        "Banner",
        req.body.photos,
        id,
        true
      );
    }

    if (result > 0) {
      const banner = await Banner.findOne({
        where: { id },
        include: {
          model: Attach,
          as: "banners",
          where: { class: "Banner" },
          required: false,
        },
      });

      return res.json(resjson(banner, "Banner was updated", ""));
    } else {
      return res.status(404).json(resjson("", "Banner not found", "", 1));
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// delete Banner
let deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findByPk(id);

    if (!banner) {
      return res.status(404).json(resjson("", "Banner not found", "", 1));
    }

    await Attach.destroy({
      where: {
        class: ["Banner"],
        foreign_id: id,
      },
    });

    const resp = await Banner.destroy({ where: { id } });

    return res.json(resjson(resp, "Banner was deleted", "", 0));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

module.exports = {
  getAllBanner,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
};
