const express = require("express");
const passport = require("passport");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");

// Load environment variables
require("dotenv").config();

//swagger
const swaggerDocument = YAML.load("./Swagger/swagger.yml");

//cron
const userTableBookingAlert = require("./utils/cron");
userTableBookingAlert();

// Create Express app
const app = express();

// Enable CORS
app.use(cors());

// Enable response compression
app.use(compression());

// Body parser middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: "5mb" }));

// Initialize Passport middleware
app.use(passport.initialize());
require("./config/passport");

// HTTP request logger
app.use(morgan("tiny"));

// Import API routes
const routes = require("./routes");
app.use("/api/v1", routes);

let options = {
  swaggerOptions: {
    defaultModelsExpandDepth: 1,
  },
};

app.use(
  "/swagger_docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, options)
);

// Error handling middleware
app.use(function (err, req, res, next) {
  if (err.code === "LIMIT_FILE_SIZE") {
    res.status(403).json({ message: "File must be 2MB or less" });
    return;
  }
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.log("Unhandled Rejection at:", promise, "reason:", reason);
});

// Start the server
const port = process.env.PORT || 3900;
app.listen(port, () =>
  console.log(`🚀------- Server started on port ${port} -------🚀`)
);
