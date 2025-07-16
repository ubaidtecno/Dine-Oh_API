const { Router } = require("express");
const router = Router();

const authRoutes = require("./authRoutes");

// Use Routes
router.use(authRoutes);

module.exports = router;
