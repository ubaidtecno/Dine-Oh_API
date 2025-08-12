const express = require("express");
const router = express.Router();

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// load models
const { Review, Restaurant, User, Attach } = require("../models");

const attach = require("./attachController");
const resjson = require("../core/resjson");

// get current Review count
let reviewStats = async (req, res) => {
  let filter = req.query.filter;
  filter === undefined
    ? (filter = "")
    : (filter = JSON.parse(req.query.filter));

  Review.count({
    where: filter.where,
  }).then((counts) => {
    res.json(resjson(counts, "", "", 0));
  });
};

// get all Review
let getAllReview = async (req, res) => {
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
        attributes: { exclude: ["password", "otp"] },
        model: User,
        // include: [
        //   { model: Attach, required: false, where: { class: "UserAvatar" } },
        // ],
        required: false,
      },
      {
        model: Attach,
        as: "restaurant_review_photos",
        where: { class: "Restaurant_Review_Photo" },
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
    let banners = await Review.findAndCountAll(obj);
    return res.json(resjson(banners, "", "", 0));
  } catch (err) {
    console.log(err);
    return res.status(422).json(resjson("", "Something Went wrong", "", 1));
  }
};

// get a review  for single restaurant
let getReviewForSingleRestaurant = async (req, res) => {
  let filter = req.query.filter;
  filter === undefined
    ? (filter = "")
    : (filter = JSON.parse(req.query.filter));

  Review.findAll({
    where: { foreign_id: req.params.id, class: "Restaurant" },
    include: [
      {
        attributes: { exclude: ["password", "otp"] },
        model: User,
        // include: [
        //   { model: Attach, required: false, where: { class: "UserAvatar" } },
        // ],
        required: false,
      },
      {
        model: Attach,
        as: "restaurant_review_photos",
        where: { class: "Restaurant_Review_Photo" },
        required: false,
      },
      {
        model: Restaurant,
        required: false,
        include: {
          model: Attach,
          as: "restaurant_profile_photo",
          where: { class: "Restaurant_Profile_Photo" },
          required: false,
        },
      },
    ],
  })
    .then((Review) => {
      return res.json(resjson(Review, "", ""));
    })
    .catch((err) => {
      console.log(err);
      return res.status(422).json(resjson("", "Something Went wrong", "", 1));
    });
};

// get restaurant review
let getAllRestaurantReview = async (req, res) => {
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
        attributes: { exclude: ["password", "otp"] },
        model: User,
        // include: [
        //   { model: Attach, required: false, where: { class: "UserAvatar" } },
        // ],
        required: false,
      },
      {
        model: Attach,
        as: "restaurant_review_photos",
        where: { class: "Restaurant_Review_Photo" },
        required: false,
      },
      {
        model: Restaurant,
        required: false,
        where: filter.InRestaurant,
        include: [
          {
            model: Attach,
            as: "restaurant_profile_photo",
            where: { class: "Restaurant_Profile_Photo" },
            required: false,
          },
        ],
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
    let banners = await Review.findAndCountAll(obj);
    return res.json(resjson(banners, "", "", 0));
  } catch (err) {
    console.log(err);
    return res.status(422).json(resjson("", "Something Went wrong", "", 1));
  }
};

// get single Review
let getSingleReview = async (req, res) => {
  // console.log("i am in single get Review");
  let Review = await getReview(req.params.id);
  if (Review) {
    return res.json(resjson(Review, "", ""));
  } else if (Review === false) {
    return res.status(404).json(resjson("", "Review not found", "", 1));
  } else {
    return res.status(422).json(resjson("", "Something Went wrong", "", 1));
  }
};

// create Review
let createRestaurantReview = async (req, res) => {
  let newReview = await createReview(req.body);

  if (
    req.body.photos !== undefined &&
    req.body.photos !== null &&
    req.body.photos.length > 0
  ) {
    let isStored = await attach.multiFileStore(
      "Restaurant_Review_Photo",
      req.body.photos,
      newReview.id,
      false
    );
  }

  if (newReview) {
    let review = await getReview(newReview.id);

    if (review) {
      res.json(resjson(review, "", "", 0));
    } else {
      res.status(422).json(resjson("", "Something Went wrong", "", 1));
    }
  } else {
    res.status(422).json(resjson("", "Something Went wrong", "", 1));
  }
};

// update Review
let updateRestaurantReview = async (req, res) => {
  Review.update(req.body, {
    where: { id: req.params.id },
  })
    .then(async (result) => {
      if (
        result[0] !== 0 ||
        (req.body.photos !== undefined && req.body.photos !== null)
      ) {
        if (
          req.body.photos !== undefined &&
          req.body.photos !== null &&
          req.body.photos.length > 0
        ) {
          let isStored = await attach.multiFileStore(
            "Restaurant_Review_Photo",
            req.body.photos,
            req.params.id,
            false
          );
        }

        let Review = await getReview(req.params.id);
        if (Review) {
          return res.json(resjson(Review, "", ""));
        } else if (Review === false) {
          return res.status(404).json(resjson("", "Review not found", "", 1));
        } else {
          return res
            .status(422)
            .json(resjson("", "Something Went wrong", "", 1));
        }
      } else {
        return res.status(404).json(resjson("", "Review not found", "", 1));
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

// delete Review
let deleteRestaurantReview = async (req, res) => {
  let id = req.params.id;
  let Review = await getReview(id);
  if (Review) {
    if (deleteReview(id)) {
      return res.json(resjson("", "Review was deleted", "", 0));
    } else {
      return res.status(422).json(resjson("", "Something Went wrong", "", 1));
    }
  } else {
    return res.status(404).json(resjson("", "Review not found", "", 1));
  }
};

let getReviewRatingBasedOnRestaurant = async (req, res) => {
  console.log("ji");
  let filter = req.query.filter;
  filter === undefined
    ? (filter = "")
    : (filter = JSON.parse(req.query.filter));

  let obj = {
    rating_1: 0,
    rating_1: 0,
    rating_2: 0,
    rating_3: 0,
    rating_4: 0,
    rating_5: 0,
  };
  Review.findAll({ where: filter.where })
    .then((allReview) => {
      for (let i = 0; i < allReview.length; i++) {
        console.log(allReview[i].dataValues.description);

        if (allReview[i].dataValues.rating == 1) {
          obj.rating_1++;
        }
        if (allReview[i].dataValues.rating == 2) {
          obj.rating_2++;
        }
        if (allReview[i].dataValues.rating == 3) {
          obj.rating_3++;
        }
        if (allReview[i].dataValues.rating == 4) {
          obj.rating_4++;
        }
        if (allReview[i].dataValues.rating == 5) {
          obj.rating_5++;
        }
      }

      return res.json(resjson(obj, "", "", 0));
    })
    .catch((err) => {
      console.log("review restaurant", err);
    });
};

let deleteReview = async (id) => {
  return await Review.destroy({
    where: { id },
    individualHooks: true,
  })
    .then(async (result) => {
      await Attach.destroy({
        where: {
          class: "Restaurant_Review_Photo",
          foreign_id: id,
        },
      });
      return true;
    })
    .catch((err) => {
      console.log(err);
      return false;
    });
};

let createReview = async (newData) => {
  return await Review.create(newData)
    .then((result) => {
      if (result) {
        return result;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      return false;
    });
};

let getReview = async (id) => {
  return await Review.findOne({
    where: { id },
    include: [
      {
        attributes: { exclude: ["password", "otp", "pro_password"] },
        model: User,
        // include: [
        //   { model: Attach, required: false, where: { class: "UserAvatar" } },
        // ],
        required: false,
      },
      {
        model: Attach,
        as: "restaurant_review_photos",
        where: { class: "Restaurant_Review_Photo" },
        required: false,
      },
      {
        model: Restaurant,
        required: false,
        include: [
          {
            model: Attach,
            as: "restaurant_profile_photo",
            where: { class: "Restaurant_Profile_Photo" },
            required: false,
          },
        ],
      },
    ],
  })
    .then((Review) => {
      if (Review) {
        return Review;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      return false;
    });
};

module.exports = {
  reviewStats,
  getAllReview,
  getAllRestaurantReview,
  getSingleReview,
  createRestaurantReview,
  updateRestaurantReview,
  deleteRestaurantReview,
  getReviewRatingBasedOnRestaurant,
  getReviewForSingleRestaurant,
};
