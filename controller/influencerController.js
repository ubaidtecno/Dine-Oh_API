const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { secretOrKey } = require("../config/key");

// Load models
const { Influencer, Attach } = require("../models");
const resjson = require("../core/resjson");
const { sequelize } = require("../config/db");
const attach = require("../controller/attachController");
const sendMail = require("../core/sendEmail");
const _ = require("lodash");

// Controller function
const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const influencer = await Influencer.findOne({
      where: { email },
    });

    if (!influencer.email) {
      return res.status(401).json(resjson("", "Influencer Not Found", "", 1));
    }

    if (!influencer.is_verified) {
      return res
        .status(401)
        .json(resjson("", "Influencer Not verified", "", 1));
    }

    const isPasswordValid = await bcrypt.compare(password, influencer.password);

    if (!isPasswordValid) {
      return res
        .status(422)
        .json(resjson("", "Incorrect email or password.", "", 1));
    }

    const session_token = jwt.sign({ id: influencer.id }, secretOrKey, {
      expiresIn: "12h",
    });

    const customValues = _.omit(influencer.dataValues, [
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

  if (email) {
    let influencerByEmail = await Influencer.findOne({
      where: { email },
    });
    if (influencerByEmail) {
      return res.status(400).json(resjson("", "Email already exist!", "", 1));
    }
  }

  Influencer.create(req.body)
    .then(async (result) => {
      return res
        .status(200)
        .json(resjson(result, "Influencer SignUp Successfully", "", 0));
    })
    .catch((err) => {
      console.log(err);
      return res.status(400).json(resjson("", "Something Went wrong", "", 1));
    });
};

let getAllInfluencer = async (req, res) => {
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
        as: "influencer_profile_photo",
        where: { class: "Influencer_Profile_Photo" },
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
    let influencers = await Influencer.findAndCountAll(obj);
    return res.json(resjson(influencers, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// Retrieve single
const getInfluencer = async (req, res) => {
  try {
    const { id } = req.params;
    const influencer = await Influencer.findOne({
      where: { id },
      include: [
        {
          model: Attach,
          as: "influencer_profile_photo",
          where: { class: "Influencer_Profile_Photo" },
          required: false,
        },
      ],
    });

    if (!influencer) {
      return res.status(404).json(resjson("", "Influencer not found", "", 1));
    }

    return res.json(resjson(influencer, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let createInfluencer = async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();

    const newInfluencer = await Influencer.create(req.body);

    const payload = { id: newInfluencer.id, name: newInfluencer.email };
    const subject = `DineOh Influencer Application - Set Password`;

    jwt.sign(payload, secretOrKey, async (err, token) => {
      if (err) {
        console.log(err);
      }

      if (newInfluencer.email) {
        sendMail(
          newInfluencer.email,
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
              Welcome to Dine Oh Influencer Application! Your account has been created. Use the following link to Set Password.
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

    // Attachments for Restaurant
    if (
      req.body.profile_photo !== undefined &&
      req.body.profile_photo !== null &&
      req.body.profile_photo.length > 0
    ) {
      let isStored = await attach.multiFileStore(
        "Influencer_Profile_Photo",
        req.body.profile_photo,
        newrestaurant.id,
        false
      );
    }

    await transaction.commit();

    return res.json(resjson(newInfluencer, "Influencer was created", ""));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let updateInfluencer = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await Influencer.update(req.body, {
      where: { id },
    });

    // Attachments for Profile
    if (
      req.body.profile_photo !== undefined &&
      req.body.profile_photo !== null &&
      req.body.profile_photo.length > 0
    ) {
      let isStored = await attach.multiFileStore(
        "Influencer_Profile_Photo",
        req.body.profile_photo,
        id,
        true
      );
    }

    if (result > 0) {
      const influencer = await Influencer.findOne({
        where: { id },
        include: {
          model: Attach,
          as: "influencer_profile_photo",
          where: { class: "Influencer_Profile_Photo" },
          required: false,
        },
      });

      return res.json(resjson(influencer, "Influencer was updated", ""));
    } else {
      return res.status(404).json(resjson("", "Influencer not found", "", 1));
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let deleteInfluencer = async (req, res) => {
  try {
    const { id } = req.params;

    const influencer = await Influencer.findByPk(id);

    if (!influencer) {
      return res.status(404).json(resjson("", "Influencer not found", "", 1));
    }

    await Attach.destroy({
      where: {
        class: ["Influencer_Profile_Photo"],
        foreign_id: id,
      },
    });

    const resp = await Influencer.destroy({ where: { id } });

    return res.json(resjson(resp, "Influencer was deleted", "", 0));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

const resetPassword = async (req, res) => {
  let id = req.body.id;

  let password = req.body.password;
  let confirm_password = req.body.confirm_password;

  let influencer = await Influencer.findOne({ where: { id } });
  if (!influencer) {
    return res.status(404).json(resjson("", "Influencer not found", "", 1));
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
            Influencer.update(
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
          await Restaurant.update({ password: hash }, { where: { id } });
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
    const influencer = await Influencer.findOne({ where: { email } });

    if (!influencer) {
      return res.status(404).json(resjson("", "Email doesn't exist", "", 1));
    }

    // let code = Math.floor(1000 + Math.random() * 9000);
    const code = 1111;
    const subject = `Dine Oh - Forgot Password`;

    const message = `OTP for Dine Oh Influencer Application : <b>${code}</b>`;

    // Update the user's lastotp field with the new OTP
    await Influencer.update(
      { last_otp: code },
      { where: { id: influencer.id } }
    );

    sendMail(email, message, ``, ``, ``, ``, subject);

    return res
      .status(202)
      .json(
        resjson(
          { id: influencer.id },
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
    const influencer = await Influencer.findOne({ where: { email } });

    if (!influencer) {
      return res
        .status(404)
        .json(resjson("", "Invalid Influencer. Please try again.", "", 1));
    }

    if (influencer.last_otp !== otp) {
      return res.status(422).json(resjson("", "Invalid OTP", "", 1));
    }

    await Influencer.update(
      { last_otp: null },
      { where: { id: influencer.id } }
    );

    return res
      .status(200)
      .json(resjson({ id: influencer.id }, "OTP verified successfully", "", 0));
  } catch (err) {
    console.error("Error in verifyOtp:", err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

module.exports = {
  Login,
  SignUp,
  getAllInfluencer,
  getInfluencer,
  createInfluencer,
  updateInfluencer,
  deleteInfluencer,
  resetPassword,
  forgotPassword,
  verifyOtp,
  setPassword,
};
