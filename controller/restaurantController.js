const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// Load models
const { Restaurant, Attach } = require("../models");
const resjson = require("../core/resjson");
const { sequelize } = require("../config/db");
const attach = require("./attachController");
const _ = require("lodash");

// Controller function

let getAllRestaurant = async (req, res) => {
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
        as: "restaurant_profile_photo",
        where: { class: "Restaurant_Profile_Photo" },
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
    let restaurants = await Restaurant.findAndCountAll(obj);
    return res.json(resjson(restaurants, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// Retrieve single
const getRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findOne({
      where: { id },
      include: [
        {
          model: Attach,
          as: "restaurant_fssai_doc",
          where: { class: "Restaurant_Fssai_Doc" },
          required: false,
        },
        {
          model: Attach,
          as: "restaurant_profile_photo",
          where: { class: "Restaurant_Profile_Photo" },
          required: false,
        },
        {
          model: Attach,
          as: "restaurant_photos",
          where: { class: "Restaurant_Photo" },
          required: false,
        },
      ],
    });

    if (!restaurant) {
      return res.status(404).json(resjson("", "Restaurant not found", "", 1));
    }

    return res.json(resjson(restaurant, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let createRestaurant = async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();

    const newrestaurant = await Restaurant.create(req.body);

    if (
      req.body.documents !== undefined &&
      req.body.documents !== null &&
      req.body.documents.length > 0
    ) {
      let isStored = await attach.multiFileStore(
        "Restaurant_Fssai_Doc",
        req.body.documents,
        newrestaurant.id,
        false
      );
    }

    // Attachments for Restaurant
    if (
      req.body.profile_photo !== undefined &&
      req.body.profile_photo !== null &&
      req.body.profile_photo.length > 0
    ) {
      let isStored = await attach.multiFileStore(
        "Restaurant_Profile_Photo",
        req.body.profile_photo,
        newrestaurant.id,
        false
      );
    }

    if (
      req.body.photos !== undefined &&
      req.body.photos !== null &&
      req.body.photos.length > 0
    ) {
      let isStored = await attach.multiFileStore(
        "Restaurant_Photo",
        req.body.photos,
        newrestaurant.id,
        false
      );
    }

    await transaction.commit();

    return res.json(resjson(newrestaurant, "Restaurant was created", ""));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let updateRestaurant = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await Restaurant.update(req.body, {
      where: { id },
    });

    if (
      req.body.documents !== undefined &&
      req.body.documents !== null &&
      req.body.documents.length > 0
    ) {
      let isStored = await attach.multiFileStore(
        "Restaurant_Fssai_Doc",
        req.body.documents,
        id,
        false
      );
    }

    if (
      req.body.profile_photo !== undefined &&
      req.body.profile_photo !== null &&
      req.body.profile_photo.length > 0
    ) {
      let isStored = await attach.multiFileStore(
        "Restaurant_Profile_Photo",
        req.body.profile_photo,
        id,
        true
      );
    }

    if (
      req.body.photos !== undefined &&
      req.body.photos !== null &&
      req.body.photos.length > 0
    ) {
      let isStored = await attach.multiFileStore(
        "Restaurant_Photo",
        req.body.photos,
        id,
        false
      );
    }

    if (result > 0) {
      const restaurant = await Restaurant.findOne({
        where: { id },
        include: [
          {
            model: Attach,
            as: "restaurant_fssai_doc",
            where: { class: "Restaurant_Fssai_Doc" },
            required: false,
          },
          {
            model: Attach,
            as: "restaurant_profile_photo",
            where: { class: "Restaurant_Profile_Photo" },
            required: false,
          },
          {
            model: Attach,
            as: "restaurant_photos",
            where: { class: "Restaurant_Photo" },
            required: false,
          },
        ],
      });

      return res.json(resjson(restaurant, "Restaurant was updated", ""));
    } else {
      return res.status(404).json(resjson("", "Restaurant not found", "", 1));
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findByPk(id);

    if (!restaurant) {
      return res.status(404).json(resjson("", "Restaurant not found", "", 1));
    }

    await Attach.destroy({
      where: {
        class: [
          "Restaurant_Fssai_Doc",
          "Restaurant_Photo",
          "Restaurant_Profile_Photo",
        ],
        foreign_id: id,
      },
    });

    const resp = await Restaurant.destroy({ where: { id } });

    return res.json(resjson(resp, "Restaurant was deleted", "", 0));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

module.exports = {
  getAllRestaurant,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
};
