const User = require("./User");
const Restaurant = require("./Restaurant");
const Attach = require("./Attachment");

Restaurant.hasOne(Attach, {
  foreignKey: "foreign_id",
  as: "restaurant_profile_photo",
});
Restaurant.hasMany(Attach, {
  foreignKey: "foreign_id",
  as: "restaurant_photos",
});

module.exports = {
  User,
  Restaurant,
  Attach,
};
