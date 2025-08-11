const Attach = require("./Attachment");
const Banner = require("./Banner");
const GoogleResPhoto = require("./GoogleResPhoto");
const GoogleResReview = require("./GoogleResReview");
const GoogleRestaurant = require("./GoogleRestaurant");
const Influencer = require("./Influencer");
const Permission = require("./Permission");
const Roles = require("./Roles");
const Restaurant = require("./Restaurant");
const RestaurantOwner = require("./RestaurantOwner");
const User = require("./User");

Banner.hasOne(Attach, {
  foreignKey: "foreign_id",
  as: "banners",
});
Influencer.hasOne(Attach, {
  foreignKey: "foreign_id",
  as: "influencer_profile_photo",
});
Restaurant.hasOne(Attach, {
  foreignKey: "foreign_id",
  as: "restaurant_profile_photo",
});
Restaurant.hasMany(Attach, {
  foreignKey: "foreign_id",
  as: "restaurant_photos",
});
Restaurant.hasMany(Attach, {
  foreignKey: "foreign_id",
  as: "restaurant_fssai_doc",
});
User.belongsTo(Roles, { foreignKey: "role_id" });

GoogleRestaurant.hasMany(GoogleResPhoto, {
  foreignKey: "google_restaurant_id",
  as: "photos",
});
GoogleRestaurant.hasMany(GoogleResReview, {
  foreignKey: "google_restaurant_id",
  as: "reviews",
});

module.exports = {
  Attach,
  Banner,
  GoogleResPhoto,
  GoogleResReview,
  GoogleRestaurant,
  Influencer,
  Permission,
  Roles,
  Restaurant,
  RestaurantOwner,
  User,
};
