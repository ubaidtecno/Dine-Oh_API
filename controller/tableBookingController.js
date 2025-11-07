const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// Load models
const {
  TableBooking,
  TableTiming,
  RestaurantTable,
  Restaurant,
  User,
  TableSlot,
} = require("../models");
const resjson = require("../core/resjson");

let getAllTableBookings = async (req, res) => {
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
        model: Restaurant,
        required: false,
      },
      {
        model: RestaurantTable,
        required: false,
      },
      {
        model: TableSlot,
        required: false,
        // include: [
        //   {
        //     model: TableTiming,
        //     where: { is_available: false },
        //     required: false,
        //   },
        // ],
      },
      {
        model: User,
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
    let tableBookings = await TableBooking.findAndCountAll(obj);
    return res.json(resjson(tableBookings, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

// Retrieve single
const getTableBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const tableBooking = await TableBooking.findOne({
      where: { id },
      include: [
        {
          model: Restaurant,
          required: false,
        },
        {
          model: RestaurantTable,
          required: false,
        },
        {
          model: TableSlot,
          required: false,
        },
        {
          model: User,
          required: false,
        },
      ],
    });

    if (!tableBooking) {
      return res.status(404).json(resjson("", "Record not found", "", 1));
    }

    return res.json(resjson(tableBooking, "", "", 0));
  } catch (err) {
    console.log(err);
    res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let createTableBooking = async (req, res) => {
  try {
    const {
      restaurant_id,
      table_id,
      slot_id,
      booking_date,
      booking_start_time,
      booking_end_time,
      guest_count,
      customer_id,
      special_request,
    } = req.body;

    // Step 1: Check if table exists and is active
    const tableExists = await RestaurantTable.findOne({
      where: { id: table_id, restaurant_id, is_active: true },
    });

    if (!tableExists) {
      return res.json(resjson("", "Table not found or inactive.", ""));
    }

    // Step 2: Check for overlapping bookings
    const existingBooking = await TableBooking.findOne({
      where: {
        restaurant_id,
        table_id,
        booking_date,
        status: { [Op.in]: ["pending", "confirmed"] },
        [Op.and]: [
          { booking_start_time: { [Op.lt]: booking_end_time } },
          { booking_end_time: { [Op.gt]: booking_start_time } },
        ],
      },
    });

    if (existingBooking) {
      return res.json(
        resjson(
          "",
          "This table is already booked for the selected time slot.",
          ""
        )
      );
    }

    // Step 3: Create booking
    const newBooking = await TableBooking.create({
      restaurant_id,
      table_id,
      slot_id,
      booking_date,
      booking_start_time,
      booking_end_time,
      guest_count,
      customer_id,
      special_request,
      status: "pending",
    });

    // Step 4 (Optional): Mark timing as unavailable
    // await TableTiming.update(
    //   { is_available: false, availability: "Booked" },
    //   {
    //     where: {
    //       slot_id,
    //       [Op.and]: [
    //         { start_time: { [Op.gte]: booking_start_time } },
    //         { end_time: { [Op.lte]: booking_end_time } },
    //       ],
    //     },
    //   }
    // );

    return res.json(resjson(newBooking, "Table booked successfully.", ""));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let updateTableBooking = async (req, res) => {
  const { id } = req.params;
  const {
    restaurant_id,
    table_id,
    slot_id,
    booking_date,
    booking_start_time,
    booking_end_time,
    guest_count,
    customer_id,
    special_request,
    status,
  } = req.body;

  try {
    // Step 1: Check if booking exists
    const existingBooking = await TableBooking.findOne({ where: { id } });
    if (!existingBooking) {
      return res
        .status(404)
        .json(resjson("", "Table Booking not found.", "", 1));
    }

    // Step 2: Validate required fields for time/slot update
    if (
      table_id &&
      restaurant_id &&
      booking_date &&
      booking_start_time &&
      booking_end_time
    ) {
      // Step 2a: Check if table exists
      const tableExists = await RestaurantTable.findOne({
        where: { id: table_id, restaurant_id, is_active: true },
      });

      if (!tableExists) {
        return res.json(resjson("", "Table not found or inactive.", ""));
      }

      // Step 2b: Check for overlapping bookings (excluding the current one)
      const overlappingBooking = await TableBooking.findOne({
        where: {
          id: { [Op.ne]: id },
          restaurant_id,
          table_id,
          booking_date,
          status: { [Op.in]: ["pending", "confirmed"] },
          [Op.and]: [
            { booking_start_time: { [Op.lt]: booking_end_time } },
            { booking_end_time: { [Op.gt]: booking_start_time } },
          ],
        },
      });

      if (overlappingBooking) {
        return res.json(
          resjson(
            "",
            "This table is already booked for the selected time slot.",
            ""
          )
        );
      }
    }

    // Step 3: Perform update
    await TableBooking.update(req.body, { where: { id } });

    // Step 4: Fetch updated record
    const updatedBooking = await TableBooking.findOne({ where: { id } });

    return res.json(
      resjson(updatedBooking, "Table Booking updated successfully.", "")
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

let deleteTableBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const tableBooking = await TableBooking.findByPk(id);

    if (!tableBooking) {
      return res.status(404).json(resjson("", "Record not found", "", 1));
    }

    await TableBooking.destroy({ where: { id } });

    return res.json(resjson("", "Table Booking was deleted", "", 0));
  } catch (err) {
    console.error(err);
    return res.status(500).json(resjson("", "Internal Server Error", "", 1));
  }
};

module.exports = {
  getAllTableBookings,
  getTableBooking,
  createTableBooking,
  updateTableBooking,
  deleteTableBooking,
};
