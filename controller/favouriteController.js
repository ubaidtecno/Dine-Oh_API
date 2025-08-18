const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// Load models
const {
  Favourite,
  Item,
  Attach,
  Restaurant,
  RestaurantCuisine,
} = require("../models");
const resjson = require("../core/resjson");

let getAllFavourites = async (req, res) => {
  let filter = req.query.filter;
  filter === undefined
    ? (filter = "")
    : (filter = JSON.parse(req.query.filter));

  let limit = req.query.limit ? parseInt(req.query.limit) : req.query.limit;
  let offset = req.query.offset ? parseInt(req.query.offset) : req.query.offset;
  let serachLatt = req.query.latitude;
  let searchLong = req.query.longitude;

  //   let sortField = req.query.sortField ? req.query.sortField : "id";
  //   let sortOrder = req.query.sortField ? req.query.sortOrder : "ASC";

  let distance = Sequelize.literal(
    "6371 * acos(cos(radians(" +
      serachLatt +
      ")) * cos(radians(restaurant.latitude)) * cos(radians(" +
      searchLong +
      ") - radians(restaurant.longitute)) + sin(radians(" +
      serachLatt +
      ")) * sin(radians(restaurant.latitude)))"
  );

  if (serachLatt && searchLong) {
    obj = {
      where: filter.where,
      include: [
        {
          model: Item,
          required: false,
          // where: Sequelize.literal('`favourite`.`class`= "Items"'),
          include: [
            { model: Attach, required: false, where: { class: "Item" } },
            { model: Restaurant, required: false },
          ],
        },
        {
          model: Restaurant,
          required: false,
          attributes: { include: [[distance, "distance"]] },
          include: [
            {
              model: Attach,
              as: "restaurant_profile_photo",
              required: false,
              where: { class: "Restaurant_Profile_Photo" },
            },
            {
              model: RestaurantCuisine,
              required: false,
              include: { model: Cuisine, required: false },
            },
            {
              model: Item,
              required: false,
            },
          ],
        },
      ],
      offset,
      limit,
    };
  } else {
    obj = {
      where: filter.where,
      include: [
        {
          model: Item,
          required: false,
          // where: Sequelize.literal('`favourite`.`class`= "Items"'),
          include: [
            { model: Attach, required: false, where: { class: "Item" } },
            { model: Restaurant, required: false },
          ],
        },
        {
          model: Restaurant,
          required: false,
          include: [
            {
              model: Attach,
              as: "restaurant_profile_photo",
              required: false,
              where: { class: "Restaurant_Profile_Photo" },
            },
            {
              model: RestaurantCuisine,
              required: false,
              include: { model: Cuisine, required: false },
            },
            {
              model: Item,
              required: false,
            },
          ],
        },
      ],
      offset,
      limit,
    };
  }

  try {
    let favourites = await Favourite.findAndCountAll(obj);
    return res.json(resjson(favourites, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// Retrieve single
const getFavourite = async (req, res) => {
  try {
    const { id } = req.params;
    const favourite = await Favourite.findOne({
      where: { id },
    });

    if (!favourite) {
      return res.status(404).json(resjson("", "Favourite not found", "", 1));
    }

    return res.json(resjson(favourite, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let createFavourite = async (req, res) => {
  try {
    const count = await Favourite.count({
      where: {
        user_id: req.body.user_id,
        foreign_id: req.body.foreign_id,
        class: req.body.class,
      },
    });

    if (count === 0) {
      const newFavourite = await Favourite.create(req.body);
      if (newFavourite) {
        return res.json(resjson(newFavourite, "Favourite was created", ""));
      } else {
        return res.status(422).json(resjson("", "Something went wrong", "", 1));
      }
    } else {
      return res
        .status(422)
        .json(resjson("", "This is already marked as favourite", "", 1));
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let updateFavourite = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await Favourite.update(req.body, {
      where: { id },
    });

    if (result > 0) {
      const favourite = await Favourite.findOne({
        where: { id },
      });

      return res.json(resjson(favourite, "Favourite was updated", ""));
    } else {
      return res.status(404).json(resjson("", "Favourite not found", "", 1));
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let deleteFavourite = async (req, res) => {
  try {
    const { id } = req.params;

    const favourite = await Favourite.findByPk(id);

    if (!favourite) {
      return res.status(404).json(resjson("", "Favourite not found", "", 1));
    }

    return res.json(resjson(favourite, "Favourite was deleted", "", 0));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

module.exports = {
  getAllFavourites,
  getFavourite,
  createFavourite,
  updateFavourite,
  deleteFavourite,
};
