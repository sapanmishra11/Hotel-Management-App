const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");
const { sendInvoice } = require("../emailService");

router.post("/new", authorize("User"), async (req, res) => {
  try {
    const {
      user_id,
      hotel_id,
      check_in_date,
      check_out_date,
      gst_amount,
      total_price,
      meals,
    } = req.body;

    const newBooking = await pool.query(
      `INSERT INTO bookings (
        user_id, 
        hotel_id, 
        check_in_date, 
        check_out_date, 
        gst_amount, 
        total_price, 
        meals, 
        booking_status
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        user_id,
        hotel_id,
        check_in_date,
        check_out_date,
        gst_amount,
        total_price,
        JSON.stringify(meals),
        "pending",
      ],
    );

    const userResult = await pool.query(
      "SELECT email FROM users WHERE id = $1",
      [user_id],
    );

    if (userResult.rows.length > 0) {
      const userEmail = userResult.rows[0].email;
      sendInvoice(userEmail, newBooking.rows[0]).catch((err) =>
        console.error("Email Service Error:", err.message),
      );
    }

    const io = req.app.get("socketio");
    if (io) {
      io.to(`hotel_${hotel_id}`).emit("new_booking_alert", {
        message: "New booking received for your hotel!",
        bookingId: newBooking.rows[0].id,
        details: newBooking.rows[0],
      });
    }

    res.status(201).json(newBooking.rows[0]);
  } catch (err) {
    console.error("Booking Error:", err.message);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/user/:id", authorize("User"), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT b.*, h.hotel_name, h.city, h.images 
       FROM bookings b
       JOIN hotels h ON b.hotel_id = h.id
       WHERE b.user_id = $1 
       ORDER BY b.created_at DESC`,
      [id],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

router.get("/admin/logs", authorize("Admin"), async (req, res) => {
  const { type } = req.query;
  let queryText = "";

  if (type === "new") {
    queryText =
      "SELECT * FROM bookings WHERE created_at >= NOW() - INTERVAL '1 day' ORDER BY created_at DESC";
  } else if (type === "upcoming") {
    queryText =
      "SELECT * FROM bookings WHERE check_in_date >= CURRENT_DATE ORDER BY check_in_date ASC";
  } else if (type === "past") {
    queryText =
      "SELECT * FROM bookings WHERE check_out_date < CURRENT_DATE ORDER BY check_out_date DESC";
  } else {
    queryText = "SELECT * FROM bookings ORDER BY created_at DESC";
  }

  try {
    const logs = await pool.query(queryText);
    res.json(logs.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.get(
  "/hotel/:hotelId",
  authorize(["Admin", "Staff"]),
  async (req, res) => {
    const { hotelId } = req.params;
    try {
      const result = await pool.query(
        "SELECT * FROM bookings WHERE hotel_id = $1 ORDER BY created_at DESC",
        [hotelId],
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Staff History Error:", err.message);
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.patch("/status/:id", authorize(["Admin", "Staff"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "checked_in", "checked_out", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json(
          "Invalid status. Allowed: pending, checked_in, checked_out, cancelled",
        );
    }

    const updatedBooking = await pool.query(
      "UPDATE bookings SET booking_status = $1 WHERE id = $2 RETURNING *",
      [status, id],
    );

    if (updatedBooking.rows.length === 0) {
      return res.status(404).json("Booking not found");
    }

    res.json(updatedBooking.rows[0]);
  } catch (err) {
    console.error("Status Update Error:", err.message);
    res.status(500).json("Server Error");
  }
});

module.exports = router;
