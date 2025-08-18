const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// load models
const { Deal, DealType, Attach, Restaurant } = require("../models");
const resjson = require("../core/resjson");
const attach = require("../controller/attachController");

// get all Deal
let getAllDeal = async (req, res) => {
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
        model: DealType,
        required: false,
      },
      {
        model: Attach,
        as: "deals",
        where: { class: "Deal" },
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
    let deals = await Deal.findAndCountAll(obj);
    return res.json(resjson(deals, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// Retrieve single
const getDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const deal = await Deal.findOne({
      where: { id },
      include: [
        {
          model: Restaurant,
          required: false,
        },
        {
          model: DealType,
          required: false,
        },
        {
          model: Attach,
          as: "deal",
          where: { class: "Deal" },
          required: false,
        },
      ],
    });

    if (!deal) {
      return res.status(404).json(resjson("", "Deal not found", "", 1));
    }

    return res.json(resjson(deal, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// create Deal
let createDeal = async (req, res) => {
  try {
    const newDeal = await Deal.create(req.body);

    // Attachments for Restaurant
    if (
      req.body.photos !== undefined &&
      req.body.photos !== null &&
      req.body.photos.length > 0
    ) {
      let isStored = await attach.multiFileStore(
        "Deal",
        req.body.photos,
        newDeal.id,
        false
      );
    }

    return res.json(resjson(newDeal, "Deal was created", ""));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// update Deal
let updateDeal = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await Deal.update(req.body, {
      where: { id },
    });

    // Attachments for Profile
    if (
      req.body.photos !== undefined &&
      req.body.photos !== null &&
      req.body.photos.length > 0
    ) {
      let isStored = await attach.multiFileStore(
        "Deal",
        req.body.photos,
        id,
        true
      );
    }

    if (result > 0) {
      const deal = await Deal.findOne({
        where: { id },
        include: {
          model: Attach,
          as: "deal",
          where: { class: "Deal" },
          required: false,
        },
      });

      return res.json(resjson(deal, "Deal was updated", ""));
    } else {
      return res.status(404).json(resjson("", "Deal not found", "", 1));
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// delete Deal
let deleteDeal = async (req, res) => {
  try {
    const { id } = req.params;

    const deal = await Deal.findByPk(id);

    if (!deal) {
      return res.status(404).json(resjson("", "Deal not found", "", 1));
    }

    await Attach.destroy({
      where: {
        class: ["Deal"],
        foreign_id: id,
      },
    });

    const resp = await Deal.destroy({ where: { id } });

    return res.json(resjson(resp, "Deal was deleted", "", 0));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

module.exports = {
  getAllDeal,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
};
