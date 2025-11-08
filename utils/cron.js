const Sequelize = require("sequelize");
const cron = require("node-cron");
const Op = Sequelize.Op;
const moment = require("moment-timezone");
const dayjs = require("dayjs");

// Load Models
const {
  TableBooking,
  Restaurant,
  RestaurantTable,
  TableSlot,
  User,
  Deal,
} = require("../models");
const { sendMail } = require("../core/sendEmail");

// Runs every day at 8:00 AM IST
function userTableBookingAlert() {
  cron.schedule(
    "* * * * *",
    async () => {
      const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
      console.log(`📅 Running booking reminder job at ${now} IST`);

      try {
        const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");

        // Fetch only confirmed bookings whose booking_date is tomorrow
        const bookings = await TableBooking.findAll({
          where: {
            status: { [Op.like]: "confirmed" },
            booking_date: tomorrow,
          },
          include: [
            { model: Restaurant, required: false },
            { model: RestaurantTable, required: false },
            { model: TableSlot, required: false },
            { model: User, required: false },
            { model: Deal, required: false },
          ],
        });

        if (bookings.length === 0) {
          console.log("No bookings for tomorrow.");
          return;
        }

        for (const booking of bookings) {
          if (booking?.user?.email) {
            const subject = `Dine Oh - Table Booking Reminder`;
            const message = `
              Hello ${booking.user.first_name || "Guest"},<br><br>
              This is a friendly reminder that you have a table booked for 
              <b>${booking.Restaurant?.name || "your restaurant"}</b> 
              on <b>${dayjs(booking.booking_date).format("DD MMM YYYY")}</b> at 
              <b>${booking.booking_start_time || "N/A"}</b>.<br><br>
              We look forward to hosting you! 🍽️<br><br>
              <b>- Team Dine Oh</b>
            `;

            await sendMail(booking.user.email, "", message, subject);
            console.log(`📧 Reminder sent to ${booking.user.email}`);
          }
        }

        console.log("✅ Booking reminder cron completed successfully!");
      } catch (error) {
        console.error("❌ Error in booking reminder cron:", error);
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Kolkata",
    }
  );
}

module.exports = userTableBookingAlert;
