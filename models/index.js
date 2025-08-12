const AddOns = require("./masterTable/AddOns");
const Attach = require("./Attachment");
const Attribute = require("./masterTable/Attribute");
const Banner = require("./Banner");
// const Crust = require("./masterTable/Crust");
const Cussines = require("./masterTable/Cussines");
const GoogleResPhoto = require("./GoogleResPhoto");
const GoogleResReview = require("./GoogleResReview");
const GoogleRestaurant = require("./GoogleRestaurant");
const Influencer = require("./Influencer");
const Item = require("./Item");
const ItemAddOns = require("./ItemAddOn");
const ItemAttribute = require("./ItemAttribute");
// const ItemCrust = require("./ItemCrust");
// const ItemSize = require("./ItemSize");
const ItemType = require("./masterTable/ItemType");
const ItemVariation = require("./ItemVariation");
const Menu = require("./masterTable/Menu");
const Permission = require("./Permission");
const Roles = require("./Roles");
const Restaurant = require("./Restaurant");
const RestaurantOwner = require("./RestaurantOwner");
const Review = require("./Review");
// const Size = require("./masterTable/Size");
const WorkingDays = require("./WorkingDays");
const User = require("./User");

Banner.hasOne(Attach, {
  foreignKey: "foreign_id",
  as: "banners",
});
Influencer.hasOne(Attach, {
  foreignKey: "foreign_id",
  as: "influencer_profile_photo",
});
Item.hasOne(Attach, { foreignKey: "foreign_id" });
Item.hasMany(ItemAddOns, { foreignKey: "item_id" });
Item.hasMany(ItemAttribute, { foreignKey: "item_id" });
Item.belongsTo(Menu, { foreignKey: "menu_id" });
Item.belongsTo(Restaurant, { foreignKey: "restaurant_id" });
ItemAddOns.belongsTo(AddOns, { foreignKey: "add_ons_id" });
ItemAddOns.belongsTo(ItemType, { foreignKey: "type_id" });
ItemAttribute.belongsTo(ItemVariation, { foreignKey: "variation_id" });
ItemAttribute.belongsTo(Attribute, { foreignKey: "attribute_id" });

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
  AddOns,
  Attach,
  Attribute,
  Banner,
  // Crust,
  Cussines,
  GoogleResPhoto,
  GoogleResReview,
  GoogleRestaurant,
  Influencer,
  Item,
  ItemAddOns,
  ItemAttribute,
  // ItemCrust,
  // ItemSize,
  ItemType,
  ItemVariation,
  Menu,
  Permission,
  Roles,
  Restaurant,
  RestaurantOwner,
  Review,
  // Size,
  User,
  WorkingDays,
};
