const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authorize = require("../middleware/authorize");
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logout);
router.post("/set-password", authController.setPassword);

router.post("/add-staff", authorize("staff"), authController.addStaff);
router.get("/staff-list", authorize("staff"), authController.getStaffList);

router.get("/me", authorize(), authController.getMe);
router.put("/update-staff/:id", authorize("staff"), authController.updateStaff);
router.delete(
  "/delete-staff/:id",
  authorize("staff"),
  authController.deleteStaff,
);
router.put("/update-account/:id", authorize(), authController.updateAccount);
router.get("/users/:id", authorize(), authController.getUserProfile);

module.exports = router;
