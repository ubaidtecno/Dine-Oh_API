const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// Load models
const { ItemType } = require("../models");
const resjson = require("../core/resjson");

let getAllItemTypes = async (req, res) => {
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
    let itemtype = await ItemType.findAndCountAll(obj);
    return res.json(resjson(itemtype, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// Retrieve single
const getItemType = async (req, res) => {
  try {
    const { id } = req.params;
    const itemtype = await ItemType.findOne({
      where: { id },
    });

    if (!itemtype) {
      return res.status(404).json(resjson("", "ItemType not found", "", 1));
    }

    return res.json(resjson(itemtype, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let createItemType = async (req, res) => {
  try {
    const newitemtype = await ItemType.create(req.body);

    return res.json(resjson(newitemtype, "ItemType was created", ""));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let updateItemType = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await ItemType.update(req.body, {
      where: { id },
    });

    if (result > 0) {
      const itemtype = await ItemType.findOne({
        where: { id },
      });

      return res.json(resjson(itemtype, "ItemType was updated", ""));
    } else {
      return res.status(404).json(resjson("", "ItemType not found", "", 1));
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let deleteItemType = async (req, res) => {
  try {
    const { id } = req.params;

    const itemtype = await ItemType.findByPk(id);

    if (!itemtype) {
      return res.status(404).json(resjson("", "ItemType not found", "", 1));
    }

    return res.json(resjson(itemtype, "ItemType was deleted", "", 0));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

module.exports = {
  getAllItemTypes,
  getItemType,
  createItemType,
  updateItemType,
  deleteItemType,
};
