const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// Load models
const { Roles } = require("../models");
const resjson = require("../core/resjson");

// List of user
let getAllRoles = async (req, res) => {
  let filter = req.query.filter;
  filter === undefined
    ? (filter = "")
    : (filter = JSON.parse(req.query.filter));

  let limit = req.query.limit ? parseInt(req.query.limit) : req.query.limit;
  let offset = req.query.offset ? parseInt(req.query.offset) : req.query.offset;

  let sortField = req.query.sortField ? req.query.sortField : "id";
  let sortOrder = req.query.sortField ? req.query.sortOrder : "ASC";

  let obj = {
    where: filter.where,
    order: [[`${sortField}`, `${sortOrder}`]],
    limit,
    offset,
  };

  try {
    let roles = await Roles.findAndCountAll(obj);
    return res.json(resjson(roles, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// Retrieve single
let getRoles = async (req, res, next) => {
  try {
    const { id } = req.params;
    const roles = await Roles.findOne({
      where: { id },
    });

    if (!roles) {
      return res.status(404).json(resjson("", "Roles not found", "", 1));
    }

    return res.json(resjson(roles, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

async function getRole() {
  try {
    const roles = await Roles.findAndCountAll();
    // console.log({
    //   // count: roles.count,
    //   rows: roles.rows.map((role) => role.dataValues),
    // });
    return roles.rows.map((role) => role.dataValues);
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw error;
  }
}

// console.log(getRole())
getRole();

let createRoles = async (req, res) => {
  try {
    let newRole = await Roles.create(req.body);
    return res.json(resjson(newRole, "Roles was created", ""));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let updateRoles = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await Roles.update(req.body, {
      where: { id },
    });

    if (result > 0) {
      const updatedRole = await Roles.findByPk(id);

      return res.json(resjson(updatedRole, "Roles was updated", ""));
    } else {
      return res.status(404).json(resjson("", "Roles not found", "", 1));
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let deleteRoles = async (req, res) => {
  try {
    const { id } = req.params;

    const RoleToDelete = await Roles.findByPk(id);

    if (!RoleToDelete) {
      return res.status(404).json(resjson("", "Roles not found", "", 1));
    }
    const resp = await Roles.destroy({ where: { id } });

    return res.json(resjson(resp, "Role was deleted", "", 0));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

module.exports = {
  getAllRoles,
  getRoles,
  createRoles,
  updateRoles,
  deleteRoles,
};
