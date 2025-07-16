const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const db = {};
require("dotenv").config({ path: "../.env" });

const operatorsAliases = {
  $eq: Op.eq,
  $ne: Op.ne,
  $gte: Op.gte,
  $gt: Op.gt,
  $lte: Op.lte,
  $lt: Op.lt,
  $not: Op.not,
  $in: Op.in,
  $notIn: Op.notIn,
  $is: Op.is,
  $like: Op.like,
  $notLike: Op.notLike,
  $iLike: Op.iLike,
  $notILike: Op.notILike,
  $regexp: Op.regexp,
  $notRegexp: Op.notRegexp,
  $iRegexp: Op.iRegexp,
  $notIRegexp: Op.notIRegexp,
  $between: Op.between,
  $notBetween: Op.notBetween,
  $overlap: Op.overlap,
  $contains: Op.contains,
  $contained: Op.contained,
  $adjacent: Op.adjacent,
  $strictLeft: Op.strictLeft,
  $strictRight: Op.strictRight,
  $noExtendRight: Op.noExtendRight,
  $noExtendLeft: Op.noExtendLeft,
  $and: Op.and,
  $or: Op.or,
  $any: Op.any,
  $all: Op.all,
  $values: Op.values,
  $col: Op.col,
};

const sequelize = new Sequelize(
  process.env.DATABASE,
  process.env.USR,
  process.env.PASSWORD,
  {
    host: process.env.HOST,
    dialect: "mysql",
    operatorsAliases: operatorsAliases,
    logging: false,

    pool: {
      max: 25,
      min: 0,
      acquire: 60000,
      idle: 10000,
    },
    dialectOptions: {
      dateStrings: true,
      typeCast: function (field, next) {
        if (field.type === "DATETIME") {
          return field.string();
        }
        return next();
      },
      // timezone: "+03:00" // for writing to database}
    },
    timezone: "-05:00",
  }
);
// sequelize
//   .authenticate()
//   .then(() => console.log("Connection has been established successfully."))
//   .catch((err) => console.error("Unable to connect to the database:", err));

db.Sequelize = Sequelize;
db.sequelize = sequelize;
sequelize.sync();

module.exports = db;
