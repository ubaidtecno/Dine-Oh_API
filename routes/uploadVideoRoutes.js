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

router.get("/upload_videos/:id", auth, getUploadVideo);

router.post("/upload_videos", auth, createUploadVideo);

router.put("/upload_videos/:id", auth, updateUploadVideo);

router.delete("/upload_videos/:id", auth, deleteUploadVideo);

module.exports = router;
