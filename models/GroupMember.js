const Sequelize = require("sequelize");
const db = require("../config/db");

module.exports = db.sequelize.define(
  "group_members",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    group_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    role: {
      type: Sequelize.ENUM("member", "admin", "moderator"),
      defaultValue: "member",
    },
  },
  { timestamps: true }
);
