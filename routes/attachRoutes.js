const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  getAllAttachments,
  tempFileStore,
  deleteAttachments,
} = require("../controller/attachController");

const upload = multer({
  dest: "../temp",
  // limits: { fileSize: 1024 * 1024 * 20 },
});

router.get("/attachments", getAllAttachments);

router.post("/attachments", upload.single("file"), tempFileStore);

router.delete("/attachments/:id", deleteAttachments);

module.exports = router;
