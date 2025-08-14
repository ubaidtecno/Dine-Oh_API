const { User, Roles } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { secretOrKey } = require("../config/key");
const resjson = require("../core/resjson");
const sms = require("../core/sms");
const _ = require("lodash");
const axios = require("axios");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID;
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET;
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI;

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

// Step 1: Redirect user to Google OAuth consent screen
const googleAuth = (req, res) => {
  const scope = [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
    "openid",
  ].join(" ");

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    GOOGLE_REDIRECT_URI
  )}&response_type=code&scope=${encodeURIComponent(
    scope
  )}&access_type=offline&prompt=consent`;

  res.redirect(authUrl);
};

// Step 2: Handle callback, exchange code for tokens, get profile
const googleCallback = async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  try {
    // Exchange code for tokens
    const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const { access_token, id_token, refresh_token } = tokenRes.data;

    // Get user info from Google
    const profileRes = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const { id, email, name, picture } = profileRes.data;

    // Find or create user in DB
    let user = await User.findOne({ where: { email } });
    if (!user) {
      user = await User.create({
        first_name: name,
        email,
        provider: "google",
        providerId: id,
        access_token,
        refresh_token,
        role_id: 2,
        expiry_date: Date.now() + expires_in * 1000,
      });
    } else {
      // Update latest tokens
      await User.update({ access_token, refresh_token }, { where: { email } });
    }

    // Generate our own JWT
    const token = jwt.sign({ id: user.id }, secretOrKey, { expiresIn: "7d" });

    // Return token or redirect
    // res.json({ token, data: user });

    // Send HTML page
    res.send(`
    <html>
      <head>
        <title>Google Calendar Auth</title>
        <style>
          body { font-family: sans-serif; text-align: center; margin-top: 100px; }
        </style>
      </head>
      <body>
        <h2>✅ Google authorization successful!</h2>
        <p>You can now close this window and return to the app.</p>

        <script>
          // Optional: Notify mobile app via postMessage
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage("google_auth_success");
          }
        </script>
      </body>
    </html>
  `);
  } catch (err) {
    console.error("Google callback error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to authenticate with Google" });
  }
};

const googleSilentLogin = async (req, res) => {
  try {
    const { email } = req.body; // your app sends userId from JWT or session

    if (!email) {
      return res.status(400).json({ error: "Email ID is required" });
    }

    const user = await User.findOne({ where: { email } });

    if (!user || user.provider !== "google") {
      return res.status(404).json({ error: "Google user not found" });
    }
    console.log("access token: ", user.access_token);

    // 1️⃣ Refresh access token if expired
    if (Date.now() >= user.token_expiry) {
      const refreshRes = await axios.post(
        "https://oauth2.googleapis.com/token",
        {
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: user.refresh_token,
          grant_type: "refresh_token",
        }
      );

      await User.update(
        {
          access_token: refreshRes.data.access_token,
          expiry_date: Date.now() + refreshRes.data.expires_in * 1000,
        },
        {
          where: { email },
        }
      );
    }

    // 2️⃣ Verify user with Google API
    const profileRes = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${user.access_token}`
    );

    const profile = profileRes.data;

    // 3️⃣ Issue new JWT for your app
    const appToken = jwt.sign({ id: user.id }, secretOrKey, {
      expiresIn: "7d",
    });

    return res.json({ token: appToken, data: user, google_profile: profile });
  } catch (err) {
    console.error("Silent login error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Silent login failed" });
  }
};

// Step 1: Redirect user to Facebook OAuth consent screen
const facebookAuth = (req, res) => {
  const scope = ["email", "public_profile"].join(",");

  const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${FACEBOOK_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    FACEBOOK_REDIRECT_URI
  )}&state=fb_auth&scope=${encodeURIComponent(scope)}&response_type=code`;

  res.redirect(authUrl);
};

// Step 2: Handle callback, exchange code for tokens, get profile
const facebookCallback = async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  try {
    // Exchange code for access token
    const tokenRes = await axios.get(
      `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${FACEBOOK_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        FACEBOOK_REDIRECT_URI
      )}&client_secret=${FACEBOOK_CLIENT_SECRET}&code=${code}`
    );

    const { access_token, token_type, expires_in } = tokenRes.data;

    // Get user profile from Facebook
    const profileRes = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture.width(400).height(400)&access_token=${access_token}`
    );

    const { id, email, name, picture } = profileRes.data;

    // Find or create user in DB
    let user = await User.findOne({ where: { email } });
    if (!user) {
      user = await User.create({
        first_name: name,
        email,
        provider: "facebook",
        provider_id: id,
        access_token,
        refresh_token: null, // Facebook doesn't issue refresh tokens
        role_id: 2,
        expiry_date: Date.now() + expires_in * 1000,
      });
    } else {
      await User.update({ access_token }, { where: { email } });
    }

    // Generate our own JWT
    const token = jwt.sign({ id: user.id }, secretOrKey, { expiresIn: "7d" });

    // Send HTML page (same style as Google)
    res.send(`
    <html>
      <head>
        <title>Facebook Auth</title>
        <style>
          body { font-family: sans-serif; text-align: center; margin-top: 100px; }
        </style>
      </head>
      <body>
        <h2>✅ Facebook authorization successful!</h2>
        <p>You can now close this window and return to the app.</p>

        <script>
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage("facebook_auth_success");
          }
        </script>
      </body>
    </html>
    `);
  } catch (err) {
    console.error(
      "Facebook callback error:",
      err.response?.data || err.message
    );
    return res
      .status(500)
      .json({ error: "Failed to authenticate with Facebook" });
  }
};

// Step 3: Silent Login for Facebook
const facebookSilentLogin = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email ID is required" });
    }

    const user = await User.findOne({ where: { email } });

    if (!user || user.provider !== "facebook") {
      return res.status(404).json({ error: "Facebook user not found" });
    }

    // Facebook tokens cannot be refreshed like Google’s,
    // but you can extend them to a long-lived token
    // Check expiry (optional)
    // if (Date.now() >= user.expiry_date) {
    //   console.warn("Facebook access token expired, re-authentication required");
    //   return res.status(401).json({ error: "Facebook token expired" });
    // }

    // Verify with Facebook Graph API
    const profileRes = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture.width(400).height(400)&access_token=${user.access_token}`
    );

    const profile = profileRes.data;

    // Issue new JWT for your app
    const appToken = jwt.sign({ id: user.id }, secretOrKey, {
      expiresIn: "7d",
    });

    return res.json({ token: appToken, data: user, facebook_profile: profile });
  } catch (err) {
    console.error("Facebook login error:", err.response?.data || err.message);
    return res
      .status(500)
      .json({ error: "Failed to authenticate with Facebook" });
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
  googleAuth,
  googleCallback,
  googleSilentLogin,
  facebookAuth,
  facebookCallback,
  facebookSilentLogin,
};
