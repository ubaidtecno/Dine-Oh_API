const Sequelize = require("sequelize");
const Op = Sequelize.Op;

const {
  AddOns,
  Attach,
  Attribute,
  Item,
  ItemAddOns,
  ItemAttribute,
  ItemCrust,
  ItemSize,
  ItemType,
  ItemVariation,
  Menu,
  Restaurant,
} = require("../models");
const attach = require("../controller/attachController");
const resjson = require("../core/resjson");
const _ = require("lodash");

// get all item
const getAllItem = async (req, res) => {
  let obj;
  console.log("----i am in multi get item");
  let filter = req.query.filter;
  let whereObj;

  filter === undefined
    ? (filter = "")
    : (filter = JSON.parse(req.query.filter));
  let serachLatt = req.query.latitude;
  let searchLong = req.query.longitude;
  let radius = req.query.radius;

  let limit = req.query.limit ? parseInt(req.query.limit) : req.query.limit;
  let offset = req.query.offset ? parseInt(req.query.offset) : req.query.offset;

  radius === undefined || radius === null ? (radius = 80) : (radius = radius);
  serachLatt === undefined ? (serachLatt = null) : (serachLatt = serachLatt);
  searchLong === undefined ? (searchLong = null) : (searchLong = searchLong);

  if (req.user.role_id == 3) {
    whereObj = { [Op.and]: [{ is_active: true }, filter.where] };
  } else {
    whereObj = filter.where;
  }

  // console.log(req.user.role_id, req.user.id);
  // console.log({ whereObj });
  if (!_.isEmpty(serachLatt) && !_.isEmpty(searchLong)) {
    let distance = Sequelize.literal(
      "6371 * acos(cos(radians(" +
        serachLatt +
        ")) * cos(radians(latitude)) * cos(radians(" +
        searchLong +
        ") - radians(longitute)) + sin(radians(" +
        serachLatt +
        ")) * sin(radians(latitude)))"
    );

    obj = {
      where: whereObj,
      include: [
        {
          model: Attach,
          where: { class: "Item" },
          required: false,
        },
        {
          attributes: { include: [[distance, "distance"]] },
          model: Restaurant,
          where: Sequelize.where(distance, { [Op.lte]: radius }),
        },
        {
          model: Menu,
          where: filter.inMenu,
          required: true,
        },
        {
          model: ItemAddOns,
          required: false,
          include: { model: AddOns, required: false },
        },
      ],
      limit,
      offset,
      order: [["s_no", "DESC"]],
    };
  } else {
    obj = {
      where: whereObj,
      include: [
        {
          model: Attach,
          where: { class: "Item" },
          required: false,
        },
        {
          model: Restaurant,
          required: false,
        },
        {
          model: Menu,
          where: filter.inMenu,
          required: true,
        },
        {
          model: ItemAddOns,
          required: false,
          include: { model: AddOns, required: false },
        },
      ],
      limit,
      offset,
    };
  }
  Item.findAll(obj)
    .then((item) => {
      if (item) {
        return res.json(resjson(item, "", ""));
      } else {
        return res.status(404).json(resjson("", "Item not found", "", 1));
      }
    })
    .catch((err) => {
      console.log(err);
      return res.status(422).json(resjson("", "Something Went wrong", "", 1));
    });
};

const getSingleItem = async (req, res) => {
  console.log("---- I am in single get item");

  try {
    let item = await getItem(req.params.id);

    if (item) {
      return res.json(resjson(item, "", ""));
    } else if (item === false) {
      return res.status(404).json(resjson("", "Item not found", "", 1));
    } else {
      return res.status(422).json(resjson("", "Something went wrong", "", 1));
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

const createItem = async (req, res) => {
  try {
    const body = req.body;
    console.log(body);

    // Step 1: Check and set menu_id if menu_name is provided
    if (body.menu_name) {
      body.menu_id = await checkMenu(body.menu_name);
      if (!body.menu_id) {
        return res
          .status(422)
          .json(resjson("", "Something Went wrong1", "", 1));
      }
    }

    // Step 2: Create the Item
    const newItem = await addItem(body);

    // Step 3: Store attributes
    if (body.attributes) {
      let flag = true;
      for (const attr of body.attributes) {
        const itemAttribute = await createItemAttribute({
          attribute_id: attr.id,
          item_id: newItem.id,
          variation_id: attr.variation_id,
          value: attr.value,
          price: attr.price,
        });
        if (!itemAttribute) flag = false;
      }
      if (!flag) {
        return res.status(422).json(resjson("", "Something Went wrong", "", 1));
      }
      const item = await getItem(newItem.id);
      return res.json(resjson(item, "", "", 0));
    }

    // Step 4: Store variations
    if (body.variations) {
      const variation = await ItemVariation.create({
        item_id: newItem.id,
        value: body.variations,
        price: body.price,
      }).catch((err) => {
        console.error("in item variation", err);
        return null;
      });
      if (!variation) {
        return res.status(422).json(resjson("", "Something Went wrong", "", 1));
      }
    }

    // Step 5: Store add-ons
    const addOnsList = body.item_add_ons;
    console.log("addOnsList", addOnsList);
    if (addOnsList) {
      for (const addOn of addOnsList) {
        let add_ons_name_id = "";
        if (addOn.name) {
          add_ons_name_id = await checkAddOns(addOn.name);
          if (!add_ons_name_id) {
            return res
              .status(422)
              .json(resjson("", "Something Went wrong", "", 1));
          }
        }
        await ItemAddOns.create({
          restaurant_id: newItem.restaurant_id,
          item_id: newItem.id,
          price: addOn.price,
          add_ons_id: add_ons_name_id,
          type_id: addOn.type_id,
        }).catch((err) => console.error(err));
      }
    }

    // Step 6: Store photos
    const photosList = body.photos;
    if (photosList) {
      const isStored = await attach.multiFileStore(
        "Item",
        photosList,
        newItem.id,
        true
      );
      if (!isStored) {
        return res.status(422).json(resjson("", "Something Went wrong", "", 1));
      }
    }

    // Step 7: Return created item
    const item = await getItem(newItem.id);
    return res.json(resjson(item, "", "", 0));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

const updateItem = async (req, res) => {
  try {
    const itemId = req.params.id;

    //Menu check
    if (req.body.menu_name !== undefined) {
      req.body.menu_id = await checkMenu(req.body.menu_name);
      if (!req.body.menu_id) {
        return res.status(422).json(resjson("", "Something Went wrong", "", 1));
      }
    }

    //Update Item data
    await Item.update(req.body, { where: { id: itemId } });

    const item = await getItem(itemId);
    if (!item) {
      return res.status(404).json(resjson("", "Item not found", "", 1));
    }

    //Update AddOns only
    if (req.body.item_add_ons && !req.body.photos) {
      for (const addOn of req.body.item_add_ons) {
        let add_ons_name_id = "";
        if (addOn.name) {
          add_ons_name_id = await checkAddOns(addOn.name);
          if (!add_ons_name_id) {
            return res
              .status(422)
              .json(resjson("", "Something Went wrong", "", 1));
          }
        }

        if (addOn.id) {
          await ItemAddOns.update(
            {
              restaurant_id: item.restaurant_id,
              item_id: item.id,
              price: addOn.price,
              add_ons_id: add_ons_name_id,
              type_id: addOn.type_id,
            },
            { where: { id: addOn.id } }
          );
        } else {
          await ItemAddOns.create({
            restaurant_id: item.restaurant_id,
            item_id: item.id,
            price: addOn.price,
            add_ons_id: add_ons_name_id,
            type_id: addOn.type_id,
          });
        }
      }
      const updatedItem = await getItem(item.id);
      return res.json(resjson(updatedItem, "", "", 0));
    }

    // Update Photos only
    if (req.body.photos && !req.body.item_add_ons) {
      const isStored = await attach.multiFileStore(
        "Item",
        req.body.photos,
        item.id,
        true
      );
      if (!isStored) {
        return res.status(422).json(resjson("", "Something Went wrong", "", 1));
      }
      const updatedItem = await getItem(item.id);
      return res.json(resjson(updatedItem, "", "", 0));
    }

    //Update Both Photos + AddOns
    if (req.body.photos && req.body.item_add_ons) {
      await ItemAddOns.destroy({ where: { item_id: item.id } });
      for (const addOn of req.body.item_add_ons) {
        await ItemAddOns.create({
          restaurant_id: item.restaurant_id,
          item_id: item.id,
          price: addOn.price,
          add_ons_id: addOn.id,
        });
      }
      const isStored = await attach.multiFileStore(
        "Item",
        req.body.photos,
        item.id,
        true
      );
      if (!isStored) {
        return res.status(422).json(resjson("", "Something Went wrong", "", 1));
      }
      const updatedItem = await getItem(item.id);
      return res.json(resjson(updatedItem, "", "", 0));
    }

    // Default return
    return res.json(resjson(item, "", ""));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

const deleteItem = async (req, res) => {
  try {
    const id = req.params.id;
    const item = await getItem(id);

    if (!item) {
      return res.status(404).json(resjson("", "Item not found", "", 1));
    }

    // If item has attachment, delete it first
    if (item.attachment) {
      const attachmentDeleted = await attach.deleteFileUpdateInDb(
        item.attachment.id
      );
      if (!attachmentDeleted) {
        return res.status(422).json(resjson("", "Something went wrong", "", 1));
      }
    }

    // Delete item from DB
    const isDeleted = await destroyItem(id);
    if (!isDeleted) {
      return res.status(422).json(resjson("", "Something went wrong", "", 1));
    }

    return res.json(resjson("", "Item was deleted", "", 0));
  } catch (err) {
    console.error("Delete item error:", err);
    return res.status(500).json(resjson("", "Server error", "", 1));
  }
};

const destroyItem = async (id) => {
  try {
    await Item.destroy({
      where: { id },
      include: [
        {
          model: Attach,
          where: { class: "Item" },
          required: false,
        },
      ],
    });
    return true;
  } catch (err) {
    console.error("Delete item error:", err);
    return false;
  }
};

let checkAddOns = async (name) => {
  return await AddOns.findOne({ where: { name } })
    .then((addOns) => {
      if (addOns) {
        return addOns.id;
      } else {
        return AddOns.create({ name })
          .then((addOns) => {
            return addOns.id;
          })
          .catch((err) => {
            console.log(err);
            return false;
          });
      }
    })
    .catch((err) => {
      console.log(err);
      return false;
    });
};

let checkMenu = async (name) => {
  return await Menu.findOne({ where: { name } })
    .then(async (menu) => {
      if (menu) {
        return menu.id;
      } else {
        return await Menu.create({ name })
          .then((menu) => {
            return menu.id;
          })
          .catch((err) => {
            console.log(err);
            return false;
          });
      }
    })
    .catch((err) => {
      console.log(err);
      return false;
    });
};

let addItem = async (newData) => {
  return await Item.create(newData)
    .then((result) => {
      if (result) {
        return result;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      return false;
    });
};

let createItemAttribute = async (newData) => {
  return await ItemAttribute.create(newData)
    .then((result) => {
      if (result) {
        return result;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      return false;
    });
};

let getItem = async (id) => {
  return await Item.findOne({
    where: { id },
    include: [
      { model: Attach, where: { class: "Item" }, required: false },
      {
        model: Menu,
        required: false,
      },
      {
        model: Restaurant,
        required: false,
      },
      {
        model: ItemAddOns,
        required: false,
        include: [
          { model: AddOns, required: false },
          { model: ItemType, required: false },
        ],
      },
      {
        model: ItemAttribute,
        required: false,
        include: [
          { model: Attribute, required: false },
          { model: ItemVariation, required: false },
        ],
      },
    ],
  })
    .then((item) => {
      if (item) {
        let combination = [];
        let attributesName = [];
        let variation = [];
        item.item_attributes.forEach((element) => {
          //for variant
          if (element.dataValues.item_variation != null) {
            if (element.dataValues.item_variation.dataValues != undefined) {
              variation.push(
                element.dataValues.item_variation.dataValues.value
              );
            }
          }

          //combination
          combination.push({
            [element.attribute.dataValues.name]: [element.value],
          });

          // for attribute
          attributesName.push(element.attribute.dataValues.name);
        });

        let uniqueAttribute = [...new Set(attributesName)];
        let uniqueVarition = [...new Set(variation)];

        function customizer(objValue, srcValue) {
          if (_.isArray(objValue)) {
            return objValue.concat(srcValue);
          }
        }
        let arr = {};
        for (let i = 0; i < combination.length; i++) {
          arr = _.mergeWith(arr, combination[i], customizer);
        }
        console.log("----", arr);
        let itemWithCustomize = {};
        itemWithCustomize.types = arr;
        itemWithCustomize.attributes = uniqueAttribute;
        itemWithCustomize.variation = uniqueVarition;

        let itemParse = JSON.parse(JSON.stringify(item));

        let obj = { ...itemParse, ...itemWithCustomize };
        // obj.item = itemWithCustomize ;
        return obj;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      return false;
    });
};

module.exports = {
  getAllItem,
  getSingleItem,
  createItem,
  updateItem,
  deleteItem,
};
