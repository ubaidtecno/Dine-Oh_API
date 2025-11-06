const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// Load models
const { Restaurant, TableSlot } = require("../models");
const resjson = require("../core/resjson");
const { sequelize } = require("../config/db");
const _ = require("lodash");

// Controller function
let getAllTableSlot = async (req, res) => {
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
    include: {
      model: Restaurant,
      required: false,
    },
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

      case "table_number":
        obj.where = {
          [Op.and]: [
            filter.where,
            { table_number: { [Op.like]: `%${searchString}%` } },
          ],
        };
        break;

      case "status":
        obj.where = {
          [Op.and]: [
            filter.where,
            { status: { [Op.like]: `%${searchString}%` } },
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
            { table_number: { [Op.like]: `%${searchString}%` } },
            { status: { [Op.like]: `%${searchString}%` } },
          ],
        },
      ],
    };
  }

  try {
    let tableSlots = await TableSlot.findAndCountAll(obj);
    return res.json(resjson(tableSlots, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// Retrieve single
const getTableSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const tableSlot = await TableSlot.findOne({
      where: { id },
      include: {
        model: Restaurant,
        required: false,
      },
    });

    if (!tableSlot) {
      return res
        .status(404)
        .json(resjson("", "Table Slot not found", "", 1));
    }

    return res.json(resjson(tableSlot, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let createTableSlot = async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();

    const newTableSlot = await TableSlot.create(req.body);

    await transaction.commit();

    return res.json(
      resjson(newTableSlot, "Table Slot was created", "")
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let updateTableSlot = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await TableSlot.update(req.body, {
      where: { id },
    });

    if (result > 0) {
      const tableSlot = await TableSlot.findOne({
        where: { id },
        include: {
          model: Restaurant,
          required: false,
        },
      });

      return res.json(
        resjson(tableSlot, "Table Slot was updated", "")
      );
    } else {
      return res
        .status(404)
        .json(resjson("", "Table Slot not found", "", 1));
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let deleteTableSlot = async (req, res) => {
  try {
    const { id } = req.params;

    const tableSlot = await TableSlot.findByPk(id);

    if (!tableSlot) {
      return res
        .status(404)
        .json(resjson("", "Table Slot not found", "", 1));
    }

    const resp = await TableSlot.destroy({ where: { id } });

    return res.json(resjson(resp, "Table Slot was deleted", "", 0));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

module.exports = {
  getAllTableSlot,
  getTableSlot,
  createTableSlot,
  updateTableSlot,
  deleteTableSlot,
};
