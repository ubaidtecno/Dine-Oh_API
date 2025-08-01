const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { secretOrKey } = require("../config/key");

// Load models
const { Restaurant, Attach } = require("../models");
const resjson = require("../core/resjson");
const { sequelize } = require("../config/db");
const attach = require("../controller/attachController");
const _ = require("lodash");

// Controller function
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const restaurant = await Restaurant.findOne({
      where: { email },
    });

    if (!restaurant.email) {
      return res.status(401).json(resjson("", "Restaurant Not Found", "", 1));
    }

    if (!restaurant.is_verified) {
      return res
        .status(401)
        .json(resjson("", "Restaurant Not verified", "", 1));
    }

    const isPasswordValid = await bcrypt.compare(password, restaurant.password);

    if (!isPasswordValid) {
      return res
        .status(422)
        .json(resjson("", "Incorrect email or password.", "", 1));
    }

    const session_token = jwt.sign({ id: restaurant.id }, secretOrKey, {
      expiresIn: "12h",
    });

    const customValues = _.omit(restaurant.dataValues, [
      "password",
      "last_otp",
    ]);
    const response = {
      token: session_token,
      ...resjson(customValues, "Login Successfully"),
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).json(resjson("", "Internal server error", "", 1));
  }
};

const SignUp = async (req, res) => {
  let email = req.body.email;
  let mobile = !_.isEmpty(req.body.mobile) ? req.body.mobile : "";

  if (email) {
    let userByEmail = await getUser(email, "");
    if (userByEmail) {
      return res.status(400).json(resjson("", "Email already exist!", "", 1));
    }
  }

  User.create(req.body)
    .then(async (result) => {
      const payload = { id: result.id, name: result.email };
      const subject = `GLT - Set Password`;

      jwt.sign(payload, keys.secretOrKey, async (err, token) => {
        if (err) {
          console.log(err);
          logger.error(`users.js - User Customer Register Jwt - Error :`, err);
        }

        if (result.is_portal_access && result.email) {
          sendOtp(
            result.email,
            ``,
            `<body>
            <div
               style="
               width: 90%;
               max-width: 90%;
               padding: 15px;
               background: #f5feff;
               border: 5px solid #2196f3;
               margin: auto;
               font-family: 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, sans-serif;
               border-radius: 18px;">
    
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                   <td style="padding: 15px 3px 32px; text-align: center;">
                      <img src="https://aware360.s3.amazonaws.com/GLT_Logo.png" alt="" width="150" />
                   </td>
                </tr>
              </table>
    
              Dear ${result.first_name},
              <br />
    
              Welcome to GLT Wholesale System! Your account has been created. Use the following link to login.
              <br />
              <br />
              <b><a href=https://glt-customer.tecnovaters.com/new-password/${token}>Set Password</a></b>
              <br />
              <br />
              If you have any issues or need assistance please email us at <a href="mailto:customerservice@greatlakes-tackle.com" target="_blank">${process.env.SUPPORT_EMAIL}</a>
              <br />
              <br />
              Sincerely,
              <br />
              The Great Lakes Tackle Team.
              <br />
              <br />
            </div></body>`,
            ``,
            ``,
            ``,
            subject
          );
        }

        return res
          .status(200)
          .json(resjson("", "Customer Created Successfully", "", 0));
      });
    })
    .catch((err) => {
      console.log(err);
      logger.error(`users.js - User Customer Register Post - Error :`, err);
      return res.status(400).json(resjson("", "Something Went wrong", "", 1));
    });
};

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
        class: ["Restaurant_Photo", "Restaurant_Profile_Photo"],
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
