const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const jwt = require("jsonwebtoken");

// Load models
const {
  InfluencerGroup,
  Influencer,
  InfluencerGroupMember,
} = require("../models");
const resjson = require("../core/resjson");
const { sequelize } = require("../config/db");

// List of user
let getAllInfluencerGroup = async (req, res) => {
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
        model: InfluencerGroupMember,
        required: false,
        include: {
          model: Influencer,
          required: false,
        },
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

  await InfluencerGroup.findAndCountAll(obj)
    .then((resp) => {
      return res.json(resjson(resp, "", "", 0));
    })
    .catch((err) => {
      console.log(err);
    });
};

const getInfluencerGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const influencerGroup = await InfluencerGroup.findOne({
      where: { id },
      include: [
        {
          model: InfluencerGroupMember,
          required: false,
        },
      ],
    });

    if (!influencerGroup) {
      return res.status(404).json(resjson("", "Record not found", "", 1));
    }

    return res.json(resjson(influencerGroup, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let createInfluencerGroup = async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction(); // Start a transaction

    let newInfluencerGroup = await InfluencerGroup.create(req.body, {
      transaction,
    });

    if (req.body.members && req.body.members.length > 0) {
      for (const teamDetail of req.body.members) {
        await InfluencerGroupMember.create(
          { influencer_group_id: newInfluencerGroup.id, ...teamDetail },
          { transaction }
        );
      }
    }

    // Commit the transaction if the inflencer group creation was successful
    await transaction.commit();

    // Fetch the created record details
    newInfluencerGroup = await InfluencerGroup.findByPk(newInfluencerGroup.id, {
      include: [
        {
          model: InfluencerGroupMember,
          required: false,
        },
      ],
    });

    return res.json(
      resjson(
        newInfluencerGroup,
        "Influencer Group Created Successfully",
        "",
        0
      )
    );
  } catch (err) {
    console.log({ err });
    if (transaction) {
      await transaction.rollback(); // Rollback the transaction in case of an error
    }
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let updateInfluencerGroup = async (req, res) => {
  const { id } = req.params;
  let transaction;

  try {
    transaction = await sequelize.transaction(); // Start a transaction

    // Update the Influencer Group
    await InfluencerGroup.update(req.body, {
      where: { id },
      transaction,
    });

    // Delete and create associated team details
    await deleteAndCreateDetails(
      InfluencerGroupMember,
      req.body.members,
      id,
      transaction
    );

    await transaction.commit();

    // Fetch the updated Influencer Group along with its associated member details
    const updatedInfluencerGroup = await InfluencerGroup.findByPk(id, {
      include: [
        {
          model: InfluencerGroupMember,
          required: false,
        },
      ],
    });

    return res.json(
      resjson(updatedInfluencerGroup, "Updated Successfully", "", 0)
    );
  } catch (err) {
    console.error(err);
    await transaction.rollback(); // Rollback the transaction in case of an error
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

const deleteInfluencerGroup = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete associated Influencer Group members
    await InfluencerGroupMember.destroy({
      where: { influencer_group_id: id },
    }).catch((err) => {
      console.log(err);
      return res.status(422).json(resjson("", "Something Went wrong", "", 1));
    });

    const resp = await InfluencerGroup.destroy({ where: { id } });

    if (resp === 0) {
      return res.status(404).json(resjson("", "Record not found", "", 1));
    }

    return res.json(resjson("", "Influencer Group was deleted", "", 0));
  } catch (err) {
    console.error(err);
    await transaction.rollback(); // Rollback the transaction in case of an error
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteAndCreateDetails = async (
  model,
  detailsArray,
  influencerGroupId,
  transaction
) => {
  if (detailsArray && detailsArray.length > 0) {
    // Delete all existing details for the Influencer Group Members
    await model.destroy({
      where: { influencer_group_id: influencerGroupId },
      transaction,
    });

    // Create new details based on the updated array
    const newDetails = detailsArray.map((detail) => ({
      ...detail,
      influencer_group_id: influencerGroupId,
    }));

    await model.bulkCreate(newDetails, { transaction });
  }
};

let createInfluencerGroupMembers = async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction(); // Start a transaction
    let id = req.body.influencer_group_id;

    if (!id) {
      return res.status(400).json(resjson("", "Group ID is missing.", "", 1));
    }

    if (!req.body.members || req.body.members.length === 0) {
      return res
        .status(400)
        .json(resjson("", "Member details are missing.", "", 1));
    }

    if (req.body.members && req.body.members.length > 0) {
      for (const teamDetail of req.body.members) {
        await InfluencerGroupMember.create(
          { influencer_group_id: id, ...teamDetail },
          { transaction }
        );
      }
    }

    // Commit the transaction if the inflencer group creation was successful
    await transaction.commit();

    // Fetch the created record details
    let newInfluencerGroupMembers = await InfluencerGroupMember.findAll({
      where: {
        influencer_group_id: id,
      },
    });

    return res.json(
      resjson(
        newInfluencerGroupMembers,
        "Influencer Group Members Created Successfully",
        "",
        0
      )
    );
  } catch (err) {
    console.log({ err });
    if (transaction) {
      await transaction.rollback(); // Rollback the transaction in case of an error
    }
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

const deleteInfluencerGroupMembers = async (req, res) => {
  try {
    const { id } = req.params;

    const resp = await InfluencerGroupMember.destroy({ where: { id } });

    if (resp === 0) {
      return res.status(404).json(resjson("", "Record not found", "", 1));
    }

    return res.json(resjson("", "Influencer Group Member was deleted", "", 0));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getAllInfluencerGroup,
  getInfluencerGroup,
  createInfluencerGroup,
  updateInfluencerGroup,
  deleteInfluencerGroup,
  createInfluencerGroupMembers,
  deleteInfluencerGroupMembers,
};
