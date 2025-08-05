const User = require("./User");
const Restaurant = require("./Restaurant");
const Attach = require("./Attachment");
const GoogleResPhoto = require("./GoogleResPhoto");
const GoogleResReview = require("./GoogleResReview");
const GoogleRestaurant = require("./GoogleRestaurant");

Restaurant.hasOne(Attach, {
  foreignKey: "foreign_id",
  as: "restaurant_profile_photo",
});
Restaurant.hasMany(Attach, {
  foreignKey: "foreign_id",
  as: "restaurant_photos",
});

GoogleRestaurant.hasMany(GoogleResPhoto, {
  foreignKey: "google_restaurant_id",
  as: "photos",
});
GoogleRestaurant.hasMany(GoogleResReview, {
  foreignKey: "google_restaurant_id",
  as: "reviews",
});

module.exports = {
  User,
  Restaurant,
  Attach,
  GoogleResPhoto,
  GoogleResReview,
  GoogleRestaurant,
};
