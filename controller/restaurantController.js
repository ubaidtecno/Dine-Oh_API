const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// Load models
const {
  Restaurant,
  Attach,
  WorkingDays,
  RestaurantCuisine,
  Cuisines,
  Item,
  ItemAddOns,
  AddOns,
  Menu,
  Favourite,
  GoogleResPhoto,
  GoogleRestaurant,
  GoogleResReview,
} = require("../models");
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
      {
        model: RestaurantCuisine,
        required: true,
        where: filter.inCuisine,
        include: { model: Cuisines, required: false },
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
      case "rating":
        obj.where = {
          [Op.and]: [
            filter.where,
            { rating: { [Op.like]: `%${searchString}%` } },
          ],
        };
        break;
      case "latitude":
        obj.where = {
          [Op.and]: [
            filter.where,
            { latitude: { [Op.like]: `%${searchString}%` } },
          ],
        };
        break;
      case "longitude":
        obj.where = {
          [Op.and]: [
            filter.where,
            { longitude: { [Op.like]: `%${searchString}%` } },
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
      case "zipcode":
        obj.where = {
          [Op.and]: [
            filter.where,
            { zipcode: { [Op.like]: `%${searchString}%` } },
          ],
        };
        break;
      case "price_level":
        obj.where = {
          [Op.and]: [
            filter.where,
            { price_level: { [Op.like]: `%${searchString}%` } },
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
            { cuisines: { [Op.like]: `%${searchString}%` } },
            { rating: { [Op.like]: `%${searchString}%` } },
            { latitude: { [Op.like]: `%${searchString}%` } },
            { longitude: { [Op.like]: `%${searchString}%` } },
            { location: { [Op.like]: `%${searchString}%` } },
            { zipcode: { [Op.like]: `%${searchString}%` } },
            { price_level: { [Op.like]: `%${searchString}%` } },
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
    let userId = req.user.id;
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
        {
          model: WorkingDays,
          required: false,
        },
        {
          model: RestaurantCuisine,
          required: false,
          include: { model: Cuisines, required: false },
        },
        {
          model: Item,
          required: false,
          where: { is_active: true },
          include: [
            { model: Attach, required: false, where: { class: "Item" } },
            {
              model: Menu,
              required: false,
            },
            {
              model: ItemAddOns,
              required: false,
              include: { model: AddOns, required: false },
            },
          ],
        },
        {
          model: Favourite,
          required: false,
          where: { class: "Restaurant", user_id: userId },
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

    if (req.body.cuisine !== null && req.body.cuisine !== undefined) {
      for (let i = 0; i < req.body.cuisine.length; i++) {
        RestaurantCuisine.create({
          restaurant_id: newrestaurant.id,
          cuisine_id: req.body.cuisine[i].id,
        })
          .then()
          .catch((err) => {
            console.log(err);
          });
      }
    }

    if (req.body.working_days !== null && req.body.working_days !== undefined) {
      for (let i = 0; i < req.body.working_days.length; i++) {
        await WorkingDays.create({
          restaurant_id: newrestaurant.id,
          day: req.body.working_days[i].day,
          starting_time: req.body.working_days[i].starting_time,
          ending_time: req.body.working_days[i].ending_time,
        })
          .then()
          .catch((err) => {
            console.log(err);
          });
      }
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

    if (req.body.cuisine !== null && req.body.cuisine !== undefined) {
      RestaurantCuisine.destroy({
        where: { restaurant_id: result.id },
      })
        .then(async () => {
          for (let i = 0; i < req.body.cuisine.length; i++) {
            await RestaurantCuisine.create({
              restaurant_id: result.id,
              cuisine_id: req.body.cuisine[i].id,
            })
              .then(() => {})
              .catch((err) => {
                console.log(err);
              });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }

    if (req.body.working_days !== null && req.body.working_days !== undefined) {
      await WorkingDays.destroy({
        where: { restaurant_id: req.params.id },
      })
        .then(async () => {
          for (let i = 0; i < req.body.working_days.length; i++) {
            await WorkingDays.create({
              restaurant_id: req.params.id,
              day: req.body.working_days[i].day,
              starting_time: req.body.working_days[i].starting_time,
              ending_time: req.body.working_days[i].ending_time,
            })
              .then()
              .catch((err) => {
                console.log(err);
              });
          }
        })
        .catch((err) => {
          console.log("delete working days", err);
        });
    }

    // Attachments for Profile
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
          {
            model: WorkingDays,
            required: false,
          },
          {
            model: RestaurantCuisine,
            required: false,
            include: { model: Cuisine, required: false },
          },
          {
            model: Item,
            required: false,
            where: { is_active: true },
            include: [
              { model: Attach, required: false, where: { class: "Item" } },
              {
                model: Menu,
                required: false,
              },
              {
                model: ItemAddOns,
                required: false,
                include: { model: AddOns, required: false },
              },
            ],
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
    await RestaurantCuisine.destroy({ where: { restaurant_id: id } });
    await WorkingDays.destroy({ where: { restaurant_id: id } });

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
