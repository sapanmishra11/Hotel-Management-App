const bookingModel = require("../models/bookingModel");
const { sendInvoice } = require("../emailService");

const createNewBooking = async (req, res) => {
  try {
    const { bookingData, email } = await bookingModel.createBookingTransaction(
      req.body,
    );

    if (email) {
      try {
        await sendInvoice(email, bookingData);
      } catch (mailErr) {
        console.error("Mailer Error:", mailErr.message);
      }
    }

    const io = req.app.get("socketio");
    if (io) {
      io.to(`hotel_${req.body.hotel_id}`).emit("new_booking_alert", {
        message: "New booking received!",
        bookingId: bookingData.id,
        bookingTime: bookingData.created_at,
        details: bookingData,
      });
    }

    res.status(201).json(bookingData);
  } catch (err) {
    if (err.message === "NO_ROOMS_AVAILABLE") {
      return res
        .status(400)
        .json({ error: "No rooms available for this type" });
    }
    console.error("Booking Transaction Error:", err.message);
    res.status(500).json({ error: "Server Error" });
  }
};

const fetchMyBookings = async (req, res) => {
  try {
    const bookings = await bookingModel.getMyBookings(req.user.id);
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error fetching your bookings");
  }
};

const fetchUserBookingsById = async (req, res) => {
  try {
    const bookings = await bookingModel.getUserBookingsById(req.params.id);
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
};

const fetchAdminLogsPaginated = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const year = req.query.year;
    const offset = (page - 1) * limit;

    const [logs, totalCount] = await Promise.all([
      bookingModel.getPaginatedBookingLogs(limit, offset, status, year),
      bookingModel.getBookingLogsCount(status, year),
    ]);

    res.status(200).json({
      success: true,
      logs,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (err) {
    console.error("Pagination Controller Error:", err.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

const fetchAdminLogs = async (req, res) => {
  try {
    const logs = await bookingModel.getAdminLogs(req.query.type);
    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const fetchAdminLogsReport = async (req, res) => {
  try {
    const { status, year } = req.query;

    const logs = await bookingModel.getFullBookingLogsReport(status, year);

    const totalRevenue =
      logs.length > 0 ? parseFloat(logs[0].grand_total_revenue) : 0;
    const totalCount = logs.length;

    res.status(200).json({
      success: true,
      logs,
      summary: {
        totalRevenue,
        totalCount,
      },
    });
  } catch (err) {
    console.error("Report Controller Error:", err.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

const fetchHotelBookings = async (req, res) => {
  try {
    const bookings = await bookingModel.getBookingsByHotelId(
      req.params.hotelId,
    );
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server Error" });
  }
};

const changeBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const valid = ["pending", "checked_in", "checked_out", "cancelled"];

    if (!valid.includes(status)) return res.status(400).json("Invalid status");

    const updatedBooking = await bookingModel.updateBookingStatus(id, status);

    if (!updatedBooking) return res.status(404).json("Not found");
    res.json(updatedBooking);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
};

const deleteRoom = async (req, res) => {
  try {
    await bookingModel.deleteRoomCategory(req.params.roomId);
    res.json({ message: "Room category deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error deleting room category");
  }
};

const fetchStaffDashboardPaginated = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const activePage = parseInt(req.query.activePage) || 1;
    const historyPage = parseInt(req.query.historyPage) || 1;
    const limit = 10;

    const activeOffset = (activePage - 1) * limit;
    const historyOffset = (historyPage - 1) * limit;

    const [activeRows, activeTotal, historyRows, historyTotal] =
      await Promise.all([
        bookingModel.getPaginatedHotelBookings(
          hotelId,
          limit,
          activeOffset,
          false,
        ),
        bookingModel.getHotelBookingsCount(hotelId, false),
        bookingModel.getPaginatedHotelBookings(
          hotelId,
          limit,
          historyOffset,
          true,
        ),
        bookingModel.getHotelBookingsCount(hotelId, true),
      ]);

    res.json({
      active: {
        data: activeRows,
        pagination: {
          currentPage: activePage,
          totalPages: Math.ceil(activeTotal / limit),
          totalItems: activeTotal,
          limit,
        },
      },
      history: {
        data: historyRows,
        pagination: {
          currentPage: historyPage,
          totalPages: Math.ceil(historyTotal / limit),
          totalItems: historyTotal,
          limit,
        },
      },
    });
  } catch (err) {
    console.error("Dashboard Paginated Error:", err);
    res.status(500).json("Error fetching paginated dashboard");
  }
};

module.exports = {
  createNewBooking,
  fetchMyBookings,
  fetchUserBookingsById,
  fetchAdminLogs,
  fetchHotelBookings,
  changeBookingStatus,
  deleteRoom,
  fetchAdminLogsPaginated,
  fetchStaffDashboardPaginated,
  fetchAdminLogsReport,
};
