const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// Load models
const { Group, GroupMember, Attach, User } = require("../models");
const resjson = require("../core/resjson");
const attach = require("../controller/attachController");

let getAllGroups = async (req, res) => {
  let filter = req.query.filter;
  filter === undefined
    ? (filter = "")
    : (filter = JSON.parse(req.query.filter));

  let limit = req.query.limit ? parseInt(req.query.limit) : req.query.limit;
  let offset = req.query.offset ? parseInt(req.query.offset) : req.query.offset;
  let searchString = req.query.searchString ? req.query.searchString : "";
  let searchField = req.query.searchField ? req.query.searchField : "";

  let sortField = req.query.sortField ? req.query.sortField : "id";
  let sortOrder = req.query.sortField ? req.query.sortOrder : "ASC";

  let obj = {
    where: filter.where,
    include: [
      {
        model: GroupMember,
        required: true,
        include: {
          model: User,
          attributes: { exclude: ["password", "otp", "otp_validity"] },
          required: false,
        },
      },
      {
        model: Attach,
        as: "group_image",
        where: { class: "Group_Image" },
        required: false,
      },
    ],
    order: [[`${sortField}`, `${sortOrder}`]],
    limit,
    offset,
    distinct: true,
  };

  if (searchField !== "" && searchField != null && searchField != undefined) {
    switch (searchField) {
      case "id":
        obj.where = {
          [Op.and]: [filter.where, { id: { [Op.like]: `${searchString}%` } }],
        };
        break;

      case "name":
        obj.where = {
          [Op.and]: [
            filter.where,
            { name: { [Op.like]: `%${searchString}%` } },
          ],
        };
        break;
    }
  } else if (
    searchString !== "" &&
    searchString != null &&
    searchString != undefined
  ) {
    obj.where = {
      [Op.and]: [
        filter.where,
        {
          [Op.or]: [
            { id: { [Op.like]: `%${searchString}%` } },
            { name: { [Op.like]: `%${searchString}%` } },
          ],
        },
      ],
    };
  }

  try {
    let groups = await Group.findAndCountAll(obj);
    return res.json(resjson(groups, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// Retrieve single
const getGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findOne({
      where: { id },
      include: [
        {
          model: GroupMember,
          required: true,
          include: {
            model: User,
            attributes: { exclude: ["password", "otp", "otp_validity"] },
            required: false,
          },
        },
        {
          model: Attach,
          as: "group_image",
          where: { class: "Group_Image" },
          required: false,
        },
      ],
    });

    if (!group) {
      return res.status(404).json(resjson("", "Group not found", "", 1));
    }

    return res.json(resjson(group, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let createGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(userId);

    //permission check
    if (![1].includes(req.user.role_id)) {
      return res
        .status(422)
        .json(resjson("", "you do not have permission", "", 1));
    }

    // 1. Create group
    let newGroup = await Group.create({
      ...req.body,
      created_by: userId,
    });

    // 2. Add creator as admin in group_members
    await GroupMember.create({
      user_id: userId,
      group_id: newGroup.id,
      role: "admin",
    });

    // Image for Group
    if (
      req.body.photos !== undefined &&
      req.body.photos !== null &&
      req.body.photos.length > 0
    ) {
      let isStored = await attach.multiFileStore(
        "Group_Image",
        req.body.photos,
        newGroup.id,
        false
      );
    }

    // Fetch the created project
    newGroup = await Group.findByPk(newGroup.id, {
      include: [
        {
          model: GroupMember,
          required: true,
          include: {
            model: User,
            attributes: { exclude: ["password", "otp", "otp_validity"] },
            required: false,
          },
        },
        {
          model: Attach,
          as: "group_image",
          where: { class: "Group_Image" },
          required: false,
        },
      ],
    });

    return res.json(resjson(newGroup, "Group created successfully", ""));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let updateGroup = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await Group.update(req.body, {
      where: { id },
    });

    // Image for Group
    if (
      req.body.photos !== undefined &&
      req.body.photos !== null &&
      req.body.photos.length > 0
    ) {
      let isStored = await attach.multiFileStore(
        "Group_Image",
        req.body.photos,
        id,
        false
      );
    }

    if (result > 0) {
      const group = await Group.findOne({
        where: { id },
        include: [
          {
            model: GroupMember,
            required: true,
            include: {
              model: User,
              attributes: { exclude: ["password", "otp", "otp_validity"] },
              required: false,
            },
          },
          {
            model: Attach,
            as: "group_image",
            where: { class: "Group_Image" },
            required: false,
          },
        ],
      });

      return res.json(resjson(group, "Group was updated", ""));
    } else {
      return res.status(404).json(resjson("", "Group not found", "", 1));
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findByPk(id);

    if (!group) {
      return res.status(404).json(resjson("", "Group not found", "", 1));
    }

    await Attach.destroy({
      where: {
        class: ["Group_Image"],
        foreign_id: id,
      },
    });
    const resp = await Group.destroy({ where: { id } });

    return res.json(resjson(resp, "Group was deleted", "", 0));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let createGroupMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, role } = req.body;
    console.log(user_id);

    //permission check
    if (![1].includes(req.user.role_id)) {
      return res
        .status(422)
        .json(resjson("", "you do not have permission", "", 1));
    }

    // Fetch the group
    let fetchedGroup = await Group.findByPk(id);

    if (!fetchedGroup) {
      return res.status(404).json(resjson("", "Group not found", "", 1));
    }

    if (!fetchedGroup) {
      return res.status(404).json(resjson("", "Group not found", "", 1));
    }

    const user = await GroupMember.findOne({
      where: { user_id },
    });

    if (user) {
      return res.status(401).json(resjson("", "User already exist.", "", 1));
    }

    // 2. Add creator as admin in group_members
    await GroupMember.create({
      user_id,
      group_id: fetchedGroup.id,
      role: role || "member",
    });

    // Fetch the created project
    fetchedGroup = await Group.findByPk(fetchedGroup.id, {
      include: [
        {
          model: GroupMember,
          required: true,
          include: {
            model: User,
            attributes: { exclude: ["password", "otp", "otp_validity"] },
            required: false,
          },
        },
        {
          model: Attach,
          as: "group_image",
          where: { class: "Group_Image" },
          required: false,
        },
      ],
    });

    return res.json(resjson(fetchedGroup, "Member added successfully", ""));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

module.exports = {
  getAllGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  createGroupMember,
};
