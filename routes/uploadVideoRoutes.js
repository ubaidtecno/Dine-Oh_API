const express = require("express");
const router = express.Router();

const {
  getAllUploadVideo,
  getUploadVideo,
  createUploadVideo,
  updateUploadVideo,
  deleteUploadVideo,
} = require("../controller/uploadVideoController");

const { auth } = require("../middleware/auth");

router.get("/upload_videos", getAllUploadVideo);

router.get("/upload_videos/:id", getUploadVideo);

router.post("/upload_videos", createUploadVideo);

router.put("/upload_videos/:id", updateUploadVideo);

router.delete("/upload_videos/:id", deleteUploadVideo);

module.exports = router;
