const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const _ = require("lodash");
const { secretOrKey } = require("./key");
const { User, Influencer } = require("../models");

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey,
};

passport.use(
  "jwt",
  new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
    try {
      // Find the user based on the JWT payload
      const user = await User.findOne({ where: { id: jwtPayload.id } });

      if (user) {
        // If the user is found, you can pass it to the next middleware or route
        return done(null, user.dataValues);
      } else {
        // If the user is not found, handle the error
        return done(null, false, { message: "User not found" });
      }
    } catch (error) {
      return done(error, false);
    }
  })
);

// Strategy for Influencers
passport.use(
  "influencer-jwt",
  new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
    try {
      const influencer = await Influencer.findOne({
        where: { id: jwtPayload.id },
      });

      if (influencer) {
        return done(null, influencer.dataValues);
      } else {
        return done(null, false, { message: "Influencer not found" });
      }
    } catch (err) {
      return done(err, false);
    }
  })
);

module.exports = passport;
