const AddOns = require("./masterTable/AddOns");
const Attach = require("./Attachment");
const Attribute = require("./masterTable/Attribute");
const Banner = require("./Banner");
// const Crust = require("./masterTable/Crust");
const Cuisines = require("./masterTable/Cuisines");
const Deal = require("./Deal");
const DealType = require("./masterTable/DealType");
const Favourite = require("./Favourite");
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
const RestaurantCuisine = require("./RestaurantCuisine");
const RestaurantOwner = require("./RestaurantOwner");
const Review = require("./Review");
// const Size = require("./masterTable/Size");
const WorkingDays = require("./WorkingDays");
const Group = require("./Group");
const GroupMember = require("./GroupMember");
const User = require("./User");
const UploadVideo = require("./UploadVideo");
const Campaign = require("./campaignTable/Campaign");
const CampaignParticipation = require("./campaignTable/CampaignParticipation");
const CampaignChat = require("./campaignTable/CampaignChat");

Banner.hasOne(Attach, {
  foreignKey: "foreign_id",
  as: "banners",
});
Deal.hasOne(Attach, {
  foreignKey: "foreign_id",
  as: "deals",
});
Deal.belongsTo(DealType, { foreignKey: "deal_type_id" });
Deal.belongsTo(Restaurant, { foreignKey: "restaurant_id" });
Favourite.belongsTo(Restaurant, {
  foreignKey: "foreign_id",
  constraints: false,
});
Favourite.belongsTo(Item, {
  foreignKey: "foreign_id",
  constraints: false,
});
Favourite.belongsTo(Campaign, {
  foreignKey: "foreign_id",
  constraints: false,
});
Campaign.hasMany(Favourite, {
  foreignKey: "foreign_id",
  constraints: false,
  // scope: { class: "Campaign" }, // if you use polymorphic favourites
});
GoogleRestaurant.hasMany(GoogleResPhoto, {
  foreignKey: "google_restaurant_id",
  as: "photos",
});
GoogleRestaurant.hasMany(GoogleResReview, {
  foreignKey: "google_restaurant_id",
  as: "reviews",
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
Restaurant.hasMany(RestaurantCuisine, {
  foreignKey: "restaurant_id",
  constraints: false,
});
Restaurant.hasMany(Item, {
  foreignKey: "restaurant_id",
  constraints: false,
});
Restaurant.hasOne(Favourite, { foreignKey: "foreign_id", constraints: false });
RestaurantCuisine.belongsTo(Cuisines, {
  foreignKey: "cuisine_id",
  constraints: false,
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
User.belongsTo(Roles, { foreignKey: "role_id" });
UploadVideo.belongsTo(Restaurant, { foreignKey: "restaurant_id" });
UploadVideo.belongsTo(RestaurantOwner, { foreignKey: "restaurant_owner_id" });
UploadVideo.belongsTo(Influencer, { foreignKey: "influencer_id" });
UploadVideo.hasMany(Attach, {
  foreignKey: "foreign_id",
  as: "videos",
});
Restaurant.hasOne(UploadVideo, {
  foreignKey: "restaurant_id",
});
RestaurantOwner.hasOne(UploadVideo, {
  foreignKey: "restaurant_owner_id",
});
Influencer.hasOne(UploadVideo, {
  foreignKey: "influencer_id",
});

// Group ↔ GroupMember
Group.hasMany(GroupMember, { foreignKey: "group_id" });
GroupMember.belongsTo(Group, { foreignKey: "group_id" });

// User ↔ GroupMember
User.hasMany(GroupMember, { foreignKey: "user_id" });
GroupMember.belongsTo(User, { foreignKey: "user_id" });

Group.hasOne(Attach, {
  foreignKey: "foreign_id",
  as: "group_image",
});

Campaign.hasMany(CampaignParticipation, { foreignKey: "campaign_id" });
Campaign.hasMany(Attach, {
  foreignKey: "foreign_id",
  as: "campaign_photos",
});
Campaign.belongsTo(RestaurantOwner, { foreignKey: "restaurant_owner_id" });
CampaignParticipation.belongsTo(Influencer, { foreignKey: "influencer_id" });
CampaignChat.belongsTo(Campaign, { foreignKey: "campaign_id" });
CampaignChat.belongsTo(RestaurantOwner, { foreignKey: "restaurant_owner_id" });
CampaignChat.belongsTo(Influencer, { foreignKey: "influencer_id" });
CampaignParticipation.hasMany(Attach, {
  foreignKey: "foreign_id",
  as: "campaign_participation_photos",
});

CampaignParticipation.hasMany(UploadVideo, {
  foreignKey: "campaign_participation_id",
});
UploadVideo.belongsTo(CampaignParticipation, {
  foreignKey: "campaign_participation_id",
});

module.exports = {
  AddOns,
  Attach,
  Attribute,
  Banner,
  // Crust,
  Cuisines,
  Deal,
  DealType,
  Favourite,
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
  RestaurantCuisine,
  RestaurantOwner,
  Review,
  // Size,
  User,
  WorkingDays,
  Group,
  GroupMember,
  UploadVideo,
  Campaign,
  CampaignParticipation,
  CampaignChat,
};
