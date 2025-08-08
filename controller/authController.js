const { User, Roles } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { secretOrKey } = require("../config/key");
const resjson = require("../core/resjson");
const sms = require("../core/sms");
const _ = require("lodash");

const otpMessageTemplate = (otp) => `Your OTP for Dine-Oh app is ${otp}. 

Thank you, 
Dine-Oh Team.`;

const signUp = async (req, res) => {
  try {
    const exist_mobile = await User.findOne({
      where: { mobile: req.body.mobile },
    });

    if (exist_mobile) {
      return res
        .status(422)
        .json(resjson("", "mobile number already exist", "", 1));
    }

    let hashedPassword = bcrypt.hashSync(req.body.password, 10);
    let userData = {
      ...req.body,
      role_id: 3,
      password: hashedPassword,
    };
    let newuser = await User.create(userData);

    // Fetch the created Gallery
    newuser = await User.findByPk(newuser.id);

    return res.json(resjson(newuser, "SignUp Successfully", ""));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

const login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    const user = await User.findOne({
      where: { mobile },
    });

    if (!user) {
      return res.status(401).json(resjson("", "User not found.", "", 1));
    }

    // Check if the user's role_id is 3
    const userRole = user.role_id ? user.role_id : null;
    if (userRole !== 3) {
      return res
        .status(403)
        .json(resjson("", "Access denied. Unauthorized role.", "", 1));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res
        .status(422)
        .json(resjson("", "Incorrect mobile or password.", "", 1));
    }

    const session_token = jwt.sign({ id: user.id }, secretOrKey, {
      expiresIn: "12h",
    });

    const customValues = _.omit(user.dataValues, ["password", "last_otp"]);
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

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
      include: {
        model: Roles,
        required: false,
      },
    });

    if (!user) {
      return res.status(401).json(resjson("", "Admin not found.", "", 1));
    }

    // Check if the user's role_id is 1
    const userRole = user.role_id ? user.role_id : null;
    if (userRole == 3) {
      return res
        .status(403)
        .json(resjson("", "Access denied. Unauthorized role.", "", 1));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res
        .status(422)
        .json(resjson("", "Invalid mobile or password.", "", 1));
    }

    const session_token = jwt.sign({ id: user.id }, secretOrKey, {
      expiresIn: "2h",
    });

    const customValues = _.omit(user.dataValues, ["password", "last_otp"]);
    const response = {
      token: session_token,
      ...resjson(customValues, "Admin Login Successfully"),
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in admin login:", error);
    return res.status(500).json(resjson("", "Internal server error", "", 1));
  }
};

const forgotPassword = async (req, res) => {
  try {
    const mobile = req.body.mobile || "";
    const user = await User.findOne({ where: { mobile } });

    if (!user) {
      return res
        .status(404)
        .json(resjson("", "Mobile number doesn't exist", "", 1));
    }

    // let otp = Math.floor(1000 + Math.random() * 9000);
    const otp = 1111;

    // Update the user's lastotp field with the new OTP
    await User.update({ last_otp: otp }, { where: { id: user.id } });

    const mobileNumber = user.mobile;
    const message = otpMessageTemplate(otp);
    // sms.send(mobileNumber, message);

    return res
      .status(202)
      .json(
        resjson(
          { id: user.id },
          "Verification code has been sent to your mobile number",
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
    const { mobile, otp } = req.body;

    // Find the user by ID
    const user = await User.findOne({ where: { mobile: mobile } });

    if (!user) {
      return res
        .status(404)
        .json(resjson("", "Invalid User. Please try again.", "", 1));
    }

    if (user.last_otp !== otp) {
      return res.status(422).json(resjson("", "Invalid OTP", "", 1));
    }

    await User.update(
      { is_verified: true, last_otp: null },
      { where: { id: user.id } }
    );

    return res
      .status(200)
      .json(resjson({ id: user.id }, "OTP verified successfully", "", 0));
  } catch (err) {
    console.error("Error in verifyOtp:", err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

const resetPassword = async (req, res) => {
  let id = req.body.id;

  let password = req.body.password;
  let confirm_password = req.body.confirm_password;

  let user = await User.findOne({ where: { id } });
  if (!user) {
    return res.status(404).json(resjson("", "User not found", "", 1));
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

const changePassword = async (req, res) => {
  let id = req.user.id;
  console.log({ id });
  let user = await User.findOne({ where: { id } });
  let current_password = req.body.current_password;
  let password = req.body.password;
  let confirm_password = req.body.confirm_password;
  if (user) {
    bcrypt.compare(current_password, user.password).then((isMatch) => {
      if (isMatch) {
        if (password === confirm_password) {
          if (changepassword(id, password)) {
            res.json(resjson("", "Password changed successfully", "", ""));
          }
        } else {
          res
            .status(422)
            .json(
              resjson("", "password and confirm password didn't matched", "", 1)
            );
        }
      } else {
        res
          .status(422)
          .json(resjson("", "Current Password is not correct", "", 1));
      }
    });
  } else {
    res.status(404).json(resjson("", "user not found", "", 1));
  }
};

const getUser = async (req, res) => {
  try {
    console.log(req.user);
    const currentUserId = req.user.id;

    // Fetch the current employee's data from the database
    const currentUser = await User.findByPk(currentUserId, {
      attributes: {
        exclude: ["password", "last_otp"],
      },
    });
    res.json(resjson(currentUser, "", "", 0));
  } catch (error) {
    console.error("Error in fetching user:", error);
    return res.status(500).json(resjson("", "Internal server error", "", 1));
  }
};

async function changepassword(id, password) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) {
          reject(err);
        }
        try {
          await User.update({ password: hash }, { where: { id } });
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  });
}

// List of user
const getAllUser = async (req, res) => {
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
    attributes: { exclude: ["password", "otp", "otp_validity"] },
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

      case "first_name":
        obj.where = {
          [Op.and]: [
            filter.where,
            { first_name: { [Op.like]: `%${searchString}%` } },
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
            { first_name: { [Op.like]: `%${searchString}%` } },
          ],
        },
      ],
    };
  }

  try {
    let users = await User.findAndCountAll(obj);
    return res.json(resjson(users, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// Retrieve single
const getUserId = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({
      where: { id },
      attributes: { exclude: ["password", "last_otp"] },
    });

    if (!user) {
      return res.status(404).json(resjson("", "User not found", "", 1));
    }

    return res.json(resjson(user, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await User.update(req.body, {
      where: { id },
    });

    if (result > 0) {
      const user = await User.findOne({
        where: { id },
        attributes: { exclude: ["password", "last_otp"] },
      });

      return res.json(resjson(user, "User was updated", ""));
    } else {
      return res.status(404).json(resjson("", "User not found", "", 1));
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json(resjson("", "User not found", "", 1));
    }

    const resp = await User.destroy({ where: { id } });

    return res.json(resjson(resp, "User was deleted", "", 0));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

async function changepassword(id, password) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) {
          reject(err);
        }
        try {
          await User.update({ password: hash }, { where: { id } });
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  });
}

module.exports = {
  signUp,
  login,
  adminLogin,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword,
  getUser,
  getAllUser,
  getUserId,
  updateUser,
  deleteUser,
};
