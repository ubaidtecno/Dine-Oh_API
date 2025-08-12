const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// Load models
const { AddOns } = require("../models");
const resjson = require("../core/resjson");

let getAllAddOns = async (req, res) => {
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
    let addOns = await AddOns.findAndCountAll(obj);
    return res.json(resjson(addOns, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// Retrieve single
const getAddOn = async (req, res) => {
  try {
    const { id } = req.params;
    const addOn = await AddOns.findOne({
      where: { id },
    });

    if (!addOn) {
      return res.status(404).json(resjson("", "AddOn not found", "", 1));
    }

    return res.json(resjson(addOn, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let createAddOn = async (req, res) => {
  try {
    const newaddon = await AddOns.create(req.body);

    return res.json(resjson(newaddon, "AddOn was created", ""));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let updateAddOn = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await AddOns.update(req.body, {
      where: { id },
    });

    if (result > 0) {
      const addOn = await AddOns.findOne({
        where: { id },
      });

      return res.json(resjson(addOn, "AddOn was updated", ""));
    } else {
      return res.status(404).json(resjson("", "AddOn not found", "", 1));
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let deleteAddOn = async (req, res) => {
  try {
    const { id } = req.params;

    const addOn = await AddOns.findByPk(id);

    if (!addOn) {
      return res.status(404).json(resjson("", "AddOn not found", "", 1));
    }

    return res.json(resjson(addOn, "Addon was deleted", "", 0));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

module.exports = {
  getAllAddOns,
  getAddOn,
  createAddOn,
  updateAddOn,
  deleteAddOn,
};
