const express = require("express");
const router = express.Router();
const authorize = require("../middleware/authorize");
const roleAuth = require("../middleware/roleAuthorization");
const globalController = require("../controllers/globalController");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: (req, file, cb) => {
    cb(null, `global-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

router.get("/details", globalController.fetchGlobalDetails);
router.put("/update", roleAuth("Admin"), globalController.editGlobalDetails);

router.post(
  "/upload",
  roleAuth("Admin"),
  upload.single("image"),
  (req, res) => {
    if (!req.file) return res.status(400).json("No file uploaded");
    const imageUrl = `uploads/${req.file.filename}`;
    res.json({ imageUrl });
  },
);

module.exports = router;
