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
const axios = require("axios");

const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const YOUTUBE_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI;

const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;

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

const youtubeAuth = async (req, res) => {
  const scope = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/youtube.readonly", // 👈 YouTube scope
  ].join(" ");

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${YOUTUBE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    YOUTUBE_REDIRECT_URI
  )}&response_type=code&scope=${encodeURIComponent(
    scope
  )}&access_type=offline&prompt=consent`;

  return res.json({ success: true, authUrl });
};

const youtubeCallback = async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).json({ error: "No code provided" });

  try {
    // Exchange code for tokens
    const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: YOUTUBE_CLIENT_ID,
      client_secret: YOUTUBE_CLIENT_SECRET,
      redirect_uri: YOUTUBE_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const { access_token, refresh_token, expires_in, id_token } = tokenRes.data;

    const profileRes = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const { email, name } = profileRes.data;

    // Get YouTube channel info
    const ytRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const channel = ytRes.data.items[0]; // influencer’s main channel
    const { id: channelId, snippet, statistics } = channel;

    const subscriberCount = parseInt(statistics?.subscriberCount || "0", 10);

    //  influencer logic (threshold = 5000, you can adjust)
    const isInfluencer = subscriberCount >= 10000;

    // Store in DB (adjust based on schema)
    let user = await Influencer.findOne({ where: { channel_id: channelId } });
    if (!user) {
      user = await Influencer.create({
        email,
        name,
        user_name: snippet?.customUrl,
        provider: "youtube",
        channel_id: channelId,
        channel_title: snippet?.title,
        subscribers: subscriberCount,
        is_influencer: isInfluencer,
        access_token,
        refresh_token,
        expiry_date: Date.now() + expires_in * 1000,
      });
    } else {
      await Influencer.update(
        {
          email,
          name,
          user_name: snippet?.customUrl,
          provider: "youtube",
          channel_id: channelId,
          channel_title: snippet?.title,
          access_token,
          refresh_token,
          expiry_date: Date.now() + expires_in * 1000,
          subscribers: subscriberCount,
          is_influencer: isInfluencer,
        },
        { where: { channel_id: channelId } }
      );
    }

    // Issue app token
    const appToken = jwt.sign({ id: user.id }, secretOrKey, {
      expiresIn: "7d",
    });

    // return res.redirect(`dineoh://auth/callback?token=${appToken}`);

    // return res.json({
    //   success: true,
    //   token: appToken,
    //   data: user,
    //   youtube_profile: {
    //     id: channelId,
    //     title: snippet.title,
    //     description: snippet.description,
    //     subscribers: statistics.subscriberCount,
    //     thumbnails: snippet.thumbnails,
    //   },
    // });

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
          <h2>✅ YouTube authorization successful!</h2>
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
    console.error("YouTube OAuth error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Failed to connect YouTube" });
  }
};

const youtubeSilentLogin = async (req, res) => {
  try {
    const { email } = req.body; // or from JWT/session in your app

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find user in DB
    const user = await Influencer.findOne({
      where: { email, provider: "youtube" },
    });
    if (!user) {
      return res.status(404).json({ error: "YouTube user not found" });
    }

    let accessToken = user.access_token;

    // 1️⃣ Refresh token if expired
    if (Date.now() >= user.expiry_date) {
      const refreshRes = await axios.post(
        "https://oauth2.googleapis.com/token",
        {
          client_id: process.env.YOUTUBE_CLIENT_ID,
          client_secret: process.env.YOUTUBE_CLIENT_SECRET,
          refresh_token: user.refresh_token,
          grant_type: "refresh_token",
        }
      );

      accessToken = refreshRes.data.access_token;

      await Influencer.update(
        {
          access_token: accessToken,
          expiry_date: Date.now() + refreshRes.data.expires_in * 1000,
        },
        { where: { email } }
      );
    }

    // 2️⃣ Fetch latest YouTube channel info
    const ytRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const channel = ytRes.data.items[0];
    const { id: channelId, snippet, statistics } = channel;
    const subscriberCount = parseInt(statistics?.subscriberCount || "0", 10);

    // 3️⃣ Update influencer status in DB
    const isInfluencer = subscriberCount >= 5000;

    await Influencer.update(
      {
        subscribers: subscriberCount,
        is_influencer: isInfluencer,
      },
      { where: { channel_id: channelId } }
    );

    // 4️⃣ Issue new JWT for app
    const appToken = jwt.sign({ id: user.id }, secretOrKey, {
      expiresIn: "7d",
    });

    // Remove sensitive fields
    const customValues = _.omit(user.dataValues, [
      "password",
      "last_otp",
      "access_token",
      "refresh_token",
    ]);

    return res.json({
      success: true,
      token: appToken,
      data: customValues,
      youtube_profile: {
        id: channelId,
        title: snippet.title,
        description: snippet.description,
        subscribers: subscriberCount,
        is_influencer: isInfluencer,
        thumbnails: snippet.thumbnails,
      },
    });
  } catch (err) {
    console.error(
      "YouTube silent login error:",
      err.response?.data || err.message
    );
    return res.status(500).json({ error: "Silent login failed" });
  }
};

// Send HTML page
// res.send(`
// <html>
//   <head>
//     <title>Instagram Auth</title>
//     <style>
//       body { font-family: sans-serif; text-align: center; margin-top: 100px; }
//     </style>
//   </head>
//   <body>
//     <h2>✅ Instagram authorization successful!</h2>
//     <p>You can now close this window and return to the app.</p>

//     <script>
//       if (window.ReactNativeWebView) {
//         window.ReactNativeWebView.postMessage("instagram_auth_success");
//       }
//     </script>
//   </body>
// </html>
// `);

// Step 1: Instagram Auth URL
const instagramAuth = async (req, res) => {
  const scope = [
    "instagram_basic",
    "pages_show_list",
    "pages_read_engagement",
    "instagram_manage_insights",
    "pages_read_user_content",
    "pages_manage_metadata",
  ].join(",");

  const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    INSTAGRAM_REDIRECT_URI
  )}&scope=${encodeURIComponent(
    scope
  )}&response_type=code&state=ig_auth&auth_type=reauthenticate`;

  return res.json({ success: true, authUrl });
};

// Step 2: Instagram Callback
const instagramCallback = async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).json({ error: "No code provided" });

  try {
    // 1️⃣ Exchange code for access token
    const tokenRes = await axios.get(
      `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        INSTAGRAM_REDIRECT_URI
      )}&client_secret=${INSTAGRAM_CLIENT_SECRET}&code=${code}`
    );

    const { access_token } = tokenRes.data;
    console.log("tokenRes: ", tokenRes);

    // 2️⃣ Get FB User (with pages)
    const fbUserRes = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${access_token}`
    );
    const { id: fbUserId, name, email } = fbUserRes.data;
    console.log("fbUserRes: ", fbUserRes);

    // 3️⃣ Get Pages linked to this FB account
    const pagesRes = await axios.get(
      `https://graph.facebook.com/me/accounts?access_token=${access_token}`
    );

    const pages = pagesRes.data?.data || [];
    console.log("pagesRes: ", pagesRes);
    if (!pages.length) {
      return res.status(400).json({ error: "No Facebook Page linked" });
    }

    // 4️⃣ Get Instagram Business account from the first Page
    const pageAccessToken = pages[0].access_token;
    const pageId = pages[0].id;

    const igRes = await axios.get(
      `https://graph.facebook.com/v20.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );

    console.log("igRes: ", igRes);
    const igBusiness = igRes.data?.instagram_business_account;
    if (!igBusiness) {
      return res
        .status(400)
        .json({ error: "No Instagram business account found" });
    }

    const instagramId = igBusiness.id;

    // 5️⃣ Fetch Instagram profile
    const igProfileRes = await axios.get(
      `https://graph.facebook.com/v20.0/${instagramId}?fields=id,username,followers_count,profile_picture_url&access_token=${pageAccessToken}`
    );

    const igProfile = igProfileRes.data;

    // ✅ influencer logic (example: threshold = 10k)
    const isInfluencer = igProfile.followers_count >= 10000;

    // 6️⃣ Store or Update in DB
    let user = await Influencer.findOne({ where: { channel_id: instagramId } });
    if (!user) {
      user = await Influencer.create({
        email,
        name,
        user_name: igProfile.username,
        provider: "instagram",
        channel_id: instagramId,
        channel_title: igProfile.username,
        subscribers: igProfile.followers_count,
        is_influencer: isInfluencer,
        access_token: pageAccessToken, // Save Page token (not short-lived user token)
        expiry_date: Date.now() + 60 * 24 * 60 * 60 * 1000, // ~60 days
      });
    } else {
      await Influencer.update(
        {
          email,
          name,
          user_name: igProfile.username,
          provider: "instagram",
          channel_id: instagramId,
          channel_title: igProfile.username,
          subscribers: igProfile.followers_count,
          is_influencer: isInfluencer,
          access_token: pageAccessToken,
          expiry_date: Date.now() + 60 * 24 * 60 * 60 * 1000,
        },
        { where: { channel_id: instagramId } }
      );
    }

    // 7️⃣ Issue app token
    const appToken = jwt.sign({ id: user.id }, secretOrKey, {
      expiresIn: "7d",
    });

    // Final HTML response
    res.send(`
      <html>
        <head>
          <title>Instagram Auth</title>
          <style>
            body { font-family: sans-serif; text-align: center; margin-top: 100px; }
          </style>
        </head>
        <body>
          <h2>✅ Instagram authorization successful!</h2>
          <p>You can now close this window and return to the app.</p>
          <script>
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage("instagram_auth_success");
            }
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("Instagram OAuth error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Failed to connect Instagram" });
  }
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
      case "location":
        obj.where = {
          [Op.and]: [
            filter.where,
            { location: { [Op.like]: `%${searchString}%` } },
          ],
        };
        break;
      case "category":
        obj.where = {
          [Op.and]: [
            filter.where,
            { category: { [Op.like]: `%${searchString}%` } },
          ],
        };
        break;
      case "gender":
        obj.where = {
          [Op.and]: [
            filter.where,
            { gender: { [Op.like]: `%${searchString}%` } },
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
            { location: { [Op.like]: `%${searchString}%` } },
            { category: { [Op.like]: `%${searchString}%` } },
            { gender: { [Op.like]: `%${searchString}%` } },
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
  youtubeAuth,
  youtubeCallback,
  youtubeSilentLogin,
  instagramAuth,
  instagramCallback,
};
