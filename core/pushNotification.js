const FCM = require("fcm-push");
const User = require("../models/User");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
// const envFile = require("../environment/environment");
const { reject } = require("lodash");
const { RestaurantOwner, Influencer } = require("../models");
var admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN || "googleapis.com",
  }),
});

// const serverKey = envFile.fcm.serverKey;

// const fcm = new FCM(serverKey);

// function notificationToLocationBased(
//   serachLatt,
//   searchLong,
//   radius,
//   notificationDetails
// ) {
//   if (serachLatt && searchLong) {
//     let userCount = 0;

//     let distance = Sequelize.literal(
//       "6371 * 0.62137 * acos(cos(radians(" +
//         serachLatt +
//         ")) * cos(radians(latitude)) * cos(radians(" +
//         searchLong +
//         ") - radians(longitude)) + sin(radians(" +
//         serachLatt +
//         ")) * sin(radians(latitude)))"
//     );

//     return new Promise((resolve, reject) => {
//       User.findAll({
//         where: {
//           [Op.and]: [
//             { device_token: { [Op.ne]: null } },
//             Sequelize.where(distance, { [Op.lte]: radius }),
//           ],
//         },
//       })
//         .then((result) => {
//           if (result) {
//             userCount = result.length;
//             console.log("user", result.length);
//             result.forEach((user) => {
//               var message = {
//                 to: user.device_token,

//                 notification: {
//                   title: notificationDetails.title,
//                   body: notificationDetails.body,
//                 },
//               };

//               //promise style
//               fcm
//                 .send(message)
//                 .then(function (response) {
//                   console.log("Successfully sent with response");
//                 })
//                 .catch(function (err) {
//                   console.error(err);
//                 });
//             });
//           }

//           resolve(userCount);
//         })
//         .catch((err) => {
//           console.log(err);
//           reject(err);
//         });
//     });
//   }
// }

// function notificationBroadcast(notificationDetails, data) {
//   return new Promise((resolve, reject) => {
//     let userCount = 0;
//     User.findAll({ where: { device_token: { [Op.ne]: null } } })
//       .then((result) => {
//         if (result) {
//           userCount = result.length;
//           console.log("user", result.length);
//           result.forEach((element) => {
//             var message = {
//               to: element.device_token,

//               notification: {
//                 title: notificationDetails.title,
//                 body: notificationDetails.body,
//               },
//               data: data,
//             };

//             //promise style
//             fcm
//               .send(message)
//               .then(function (response) {
//                 console.log("Successfully sent with response");
//               })
//               .catch(function (err) {
//                 // console.log("Something has gone wrong!");
//                 console.error(err);
//               });
//           });
//         }
//         resolve(userCount);
//       })
//       .catch((err) => {
//         console.log(err);
//         reject(err);
//       });
//   });
// }

// function notificationToParticularUserId(
//   userId,
//   userType,
//   notificationDetails,
//   data
// ) {
//   let model = userType === "restaurant_owner" ? RestaurantOwner : Influencer;

//   model
//     .findOne({ where: { id: userId } })
//     .then((user) => {
//       if (user.device_token != null) {
//         // console.log("sdsd", device_token);
//         var message = {
//           to: user.device_token,
//           notification: {
//             title: notificationDetails.title,
//             body: notificationDetails.body,
//           },
//           data: data,
//         };

//         //promise style
//         fcm
//           .send(message)
//           .then(function (response) {
//             console.log("Successfully sent with response: ", response);
//           })
//           .catch(function (err) {
//             console.log("Something has gone wrong!");
//             console.error(err);
//           });
//       }
//     })
//     .catch((err) => {
//       console.log(err);
//     });
// }

function notificationToParticularUserId(
  userId,
  userType,
  notificationDetails,
  data
) {
  let model = userType === "restaurant_owner" ? RestaurantOwner : Influencer;

  model
    .findOne({ where: { id: userId } })
    .then((user) => {
      const safeData = {};
      if (data && typeof data === "object") {
        for (let key in data) {
          safeData[key] = String(data[key]);
        }
      }

      if (user && user.device_token) {
        const message = {
          token: user.device_token, // ✅ use "token" instead of "to"
          notification: {
            title: notificationDetails.title,
            body: notificationDetails.body,
          },
          data: safeData || {}, // ✅ safe fallback
        };

        // Use Firebase Admin SDK instead of fcm-node
        admin
          .messaging()
          .send(message)
          .then((response) => {
            console.log("Successfully sent with response:", response);
          })
          .catch((err) => {
            console.error("Error sending message:", err);
          });
      } else {
        // ✅ Fallback: send to test topic
        message = {
          topic: "testTopic",
          notification: {
            title: notificationDetails.title,
            body: notificationDetails.body,
          },
          data: safeData || {},
        };
        console.log("🧪 No device token found, sending to testTopic instead");

        admin
          .messaging()
          .send(message)
          .then((response) => {
            console.log("Successfully sent with response:", response);
          })
          .catch((err) => {
            console.error("Error sending message:", err);
          });
      }
    })
    .catch((err) => {
      console.error("DB lookup error:", err);
    });
}

module.exports = {
  // notificationBroadcast,
  notificationToParticularUserId,
  // notificationToLocationBased,
};
