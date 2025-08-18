const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { secretOrKey } = require("../config/key");

// Load models
const { Restaurant, RestaurantOwner, Attach } = require("../models");
const resjson = require("../core/resjson");
const attach = require("../controller/attachController");
const sendMail = require("../core/sendEmail");
const _ = require("lodash");

// Controller function
const resLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const restaurant = await RestaurantOwner.findOne({
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

const resSignUp = async (req, res) => {
  try {
    let { email, password, restaurants, ...restBody } = req.body;
    restBody.email = email;

    if (email) {
      let userByEmail = await RestaurantOwner.findOne({
        where: { email },
      });
      if (userByEmail) {
        return res.status(400).json(resjson("", "Email already exist!", "", 1));
      }
    }

    // Hash the password before creating the user
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      restBody.password = hashedPassword;
    }

    const newRestaurantOwner = await RestaurantOwner.create(restBody);

    if (req.body.restaurants && req.body.restaurants.length > 0) {
      for (const restaurant of req.body.restaurants) {
        const newrestaurant = await Restaurant.create({
          restaurant_owner_id: newRestaurantOwner.id,
          ...restaurant,
        });

        if (
          restaurant.documents !== undefined &&
          restaurant.documents !== null &&
          restaurant.documents.length > 0
        ) {
          let isStored = await attach.multiFileStore(
            "Restaurant_Fssai_Doc",
            restaurant.documents,
            newrestaurant.id,
            false
          );
        }

        if (
          restaurant.profile_photo !== undefined &&
          restaurant.profile_photo !== null &&
          restaurant.profile_photo.length > 0
        ) {
          let isStored = await attach.multiFileStore(
            "Restaurant_Profile_Photo",
            restaurant.profile_photo,
            newrestaurant.id,
            false
          );
        }

        if (
          restaurant.photos !== undefined &&
          restaurant.photos !== null &&
          restaurant.photos.length > 0
        ) {
          let isStored = await attach.multiFileStore(
            "Restaurant_Photo",
            restaurant.photos,
            newrestaurant.id,
            false
          );
        }
      }
    }

    return res.json(
      resjson(newRestaurantOwner, "Restaurant SignUp Successfully", "")
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let getAllRestaurantOwner = async (req, res) => {
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
    let restaurants = await RestaurantOwner.findAndCountAll(obj);
    return res.json(resjson(restaurants, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// Retrieve single
const getRestaurantOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await RestaurantOwner.findOne({
      where: { id },
    });

    if (!restaurant) {
      return res
        .status(404)
        .json(resjson("", "Restaurant profile not found", "", 1));
    }

    return res.json(resjson(restaurant, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let createRestaurantOwner = async (req, res) => {
  try {
    const newrestaurant = await RestaurantOwner.create(req.body);

    const payload = {
      id: newrestaurant.id,
      name: newrestaurant.email,
    };
    const subject = `DineOh Restaurant Application - Set Password`;

    jwt.sign(payload, secretOrKey, async (err, token) => {
      if (err) {
        console.log(err);
      }

      if (newrestaurant.email) {
        sendMail(
          newrestaurant.email,
          ``,
          `<body>
            <div
               style="
               width: 90%;
               max-width: 90%;
               padding: 15px;
               background: #b9bcbcff;
               border: 5px solid #e77f4eff;
               margin: auto;
               font-family: 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, sans-serif;
               border-radius: 18px;">
    
              Dear Sir,
              <br />
              <br />
              Welcome to Dine Oh Application! Your account has been created. Use the following link to Set Password.
              <br />
              <br />
              <b><a href=http://glt-customer.tecnovaters.com/new-password/${token}>Set Password</a></b>
              <br />
              <br />
              If you have any issues or need assistance please email us at <a href="mailto:customerservice@greatlakes-tackle.com" target="_blank">${process.env.SUPPORT_EMAIL}</a>
              <br />
              <br />
              Sincerely,
              <br />
              The Dine Oh Team.
              <br />
              <br />
            </div></body>`,
          ``,
          ``,
          ``,
          subject
        );
      }
    });

    return res.json(
      resjson(newrestaurant, "Restaurant Profile was created", "")
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let updateRestaurantOwner = async (req, res) => {
  const { id } = req.params;
  const { is_verified } = req.body;

  try {
    // Update record
    const [updatedCount] = await RestaurantOwner.update(req.body, {
      where: { id },
    });

    if (updatedCount === 0) {
      return res
        .status(404)
        .json(resjson("", "Restaurant profile not found", "", 1));
    }

    // Fetch updated restaurant owner
    const restaurantOwner = await RestaurantOwner.findOne({ where: { id } });

    if (!restaurantOwner) {
      return res
        .status(404)
        .json(resjson("", "Restaurant profile not found", "", 1));
    }

    // Send verification email only if is_verified is true and email exists
    if (is_verified && restaurantOwner.email) {
      const subject = `DineOh Restaurant Application - Verification Successful`;

      await sendMail(
        restaurantOwner.email,
        ``,
        `<body>
          <div
             style="
             width: 90%;
             max-width: 90%;
             padding: 15px;
             background: #b9bcbcff;
             border: 5px solid #e77f4eff;
             margin: auto;
             font-family: 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, sans-serif;
             border-radius: 18px;">
  
            Dear Sir,
            <br /><br />
            Welcome to Dine Oh Application! Your account has been verified. Now you can access the Restaurant Application.
            <br /><br />
            If you have any issues or need assistance please email us at 
            <a href="mailto:${process.env.SUPPORT_EMAIL}" target="_blank">${process.env.SUPPORT_EMAIL}</a>
            <br /><br />
            Sincerely,
            <br />
            The Dine Oh Team.
            <br /><br />
          </div>
        </body>`,
        ``,
        ``,
        ``,
        subject
      );
    }

    return res.json(
      resjson(restaurantOwner, "Restaurant profile was updated", "")
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let deleteRestaurantOwner = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurantOwner = await RestaurantOwner.findByPk(id);

    if (!restaurantOwner) {
      return res
        .status(404)
        .json(resjson("", "Restaurant profile not found", "", 1));
    }

    const restaurant = await Restaurant.findByPk({
      where: {
        restaurant_Owner_id: id,
      },
    });

    await Attach.destroy({
      where: {
        class: [
          "Restaurant_Fssai_Doc",
          "Restaurant_Photo",
          "Restaurant_Profile_Photo",
        ],
        foreign_id: restaurant.id,
      },
    });

    await Restaurant.destroy({
      where: {
        id: restaurant.id,
      },
    });

    const resp = await RestaurantOwner.destroy({ where: { id } });

    return res.json(resjson(resp, "Restaurant profile was deleted", "", 0));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

const resetPassword = async (req, res) => {
  let id = req.body.id;

  let password = req.body.password;
  let confirm_password = req.body.confirm_password;

  let restaurant = await RestaurantOwner.findOne({ where: { id } });
  if (!restaurant) {
    return res
      .status(404)
      .json(resjson("", "Restaurant profile not found", "", 1));
  }
  if (password === confirm_password) {
    if (changepassword(id, password)) {
      res.json(resjson("", "Your password has been reset successfully", "", 0));
    } else {
      badRequest(res, "something went wrong, try again later");
    }
  } else {
    badRequest(res, "password and confirm password didn't matched");
  }
};

const setPassword = async (req, res) => {
  let token = req.body.token;
  let newPassword = req.body.password;

  jwt.verify(token, secretOrKey, function (err, decoded) {
    if (err) {
      return res.status(422).json(resjson("", "invalid token", "", 1));
    } else {
      if (decoded) {
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newPassword, salt, async (err, hash) => {
            if (err) {
              console.log(err);
            }
            let password = hash;
            RestaurantOwner.update(
              {
                password: password,
              },
              {
                where: { id: decoded.id },
              }
            )
              .then((result) => {
                return res.json(
                  resjson("", "password set successfully", "", 0)
                );
              })
              .catch((err) => {
                console.log(err);
                res
                  .status(400)
                  .json(resjson("", "Something Went wrong", "", 1));
              });
          });
        });
      } else {
        return res.status(422).json(resjson("", "invalid token", "", 1));
      }
    }
  });
};

async function changepassword(id, password) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) {
          reject(err);
        }
        try {
          await RestaurantOwner.update({ password: hash }, { where: { id } });
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  });
}

const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email || "";
    const restaurant = await RestaurantOwner.findOne({ where: { email } });

    if (!restaurant) {
      return res.status(404).json(resjson("", "Email doesn't exist", "", 1));
    }

    // let code = Math.floor(1000 + Math.random() * 9000);
    const code = 1111;
    const subject = `Dine Oh - Forgot Password`;

    const message = `OTP for Dine Oh Restaurant Application : <b>${code}</b>`;

    // Update the user's lastotp field with the new OTP
    await RestaurantOwner.update(
      { last_otp: code },
      { where: { id: restaurant.id } }
    );

    sendMail(email, message, ``, ``, ``, ``, subject);

    return res
      .status(202)
      .json(
        resjson(
          { id: restaurant.id },
          "Verification code has been sent to your Email",
          "",
          "",
          ""
        )
      );
  } catch (err) {
    console.error("Error in forgotPassword:", err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find the user by ID
    const restaurant = await RestaurantOwner.findOne({ where: { email } });

    if (!restaurant) {
      return res
        .status(404)
        .json(
          resjson("", "Invalid Restaurant Profile. Please try again.", "", 1)
        );
    }

    if (restaurant.last_otp !== otp) {
      return res.status(422).json(resjson("", "Invalid OTP", "", 1));
    }

    await RestaurantOwner.update(
      { last_otp: null },
      { where: { id: restaurant.id } }
    );

    return res
      .status(200)
      .json(resjson({ id: restaurant.id }, "OTP verified successfully", "", 0));
  } catch (err) {
    console.error("Error in verifyOtp:", err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

module.exports = {
  resLogin,
  resSignUp,
  getAllRestaurantOwner,
  getRestaurantOwner,
  createRestaurantOwner,
  updateRestaurantOwner,
  deleteRestaurantOwner,
  resetPassword,
  forgotPassword,
  verifyOtp,
  setPassword,
};
