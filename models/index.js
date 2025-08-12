const User = require("./User");
const WorkingDays = require("./WorkingDays");
const Review = require("./Review");
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

Restaurant.hasMany(WorkingDays, {
  foreignKey: "restaurant_id",
  constraints: false,
});
Review.belongsTo(User, { foreignKey: "user_id", constraints: false });
Review.belongsTo(Restaurant, { foreignKey: "foreign_id", constraints: false });
Review.hasMany(Attach, {
  foreignKey: "foreign_id",
  as: "restaurant_review_photos",
});

module.exports = {
  User,
  Restaurant,
  WorkingDays,
  Review,
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
