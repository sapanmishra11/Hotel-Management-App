const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const authorize = require("../middleware/authorize");
const roleAuth = require("../middleware/roleAuthorization");

router.post("/new", roleAuth("User"), bookingController.createNewBooking);

router.get("/my-bookings", authorize(), bookingController.fetchMyBookings);

router.get("/admin/logs", authorize("logs"), bookingController.fetchAdminLogs);

router.get(
  "/admin/logs/paginated",
  authorize("logs"),
  bookingController.fetchAdminLogsPaginated,
);

router.get(
  "/admin/logs",
  authorize("hotels"),
  bookingController.fetchAdminLogs,
);

router.get(
  "/admin/logs/report",
  authorize("logs"),
  bookingController.fetchAdminLogsReport,
);

router.get(
  "/hotel/:hotelId/paginated",
  roleAuth(["Staff"]),
  bookingController.fetchStaffDashboardPaginated,
);

router.get(
  "/hotel/:hotelId",
  roleAuth(["Admin", "Staff"]),
  bookingController.fetchHotelBookings,
);

router.patch(
  "/status/:id",
  roleAuth(["Admin", "Staff"]),
  bookingController.changeBookingStatus,
);

router.delete(
  "/rooms/:roomId",
  authorize("hotels"),
  bookingController.deleteRoom,
);

router.get(
  "/user/:id",
  roleAuth("User"),
  bookingController.fetchUserBookingsById,
);

module.exports = router;
