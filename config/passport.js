const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const _ = require("lodash");
const { secretOrKey } = require("./key");
const { User } = require("../models");

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

module.exports = passport;
