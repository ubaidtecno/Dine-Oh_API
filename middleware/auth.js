const passport = require("passport");

module.exports = {
  auth: passport.authenticate("jwt", { session: false }),
  influencerAuth: passport.authenticate("influencer-jwt", { session: false }),
};
