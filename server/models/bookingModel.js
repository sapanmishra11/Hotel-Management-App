const pool = require("../db");

const getMyBookings = async (userId) => {
  const query = `
    SELECT 
      b.*, 
      COALESCE(b.meals, '[]'::jsonb) as meals,
      h.hotel_name, h.city, h.state,
      (SELECT image_url FROM hotel_images WHERE hotel_id = h.id LIMIT 1) as hotel_image
    FROM bookings b
    JOIN hotels h ON b.hotel_id = h.id
    WHERE b.user_id = $1
    ORDER BY b.created_at DESC
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

const getUserBookingsById = async (userId) => {
  const result = await pool.query(
    `SELECT b.*, h.hotel_name, h.city, 
      COALESCE((SELECT image_url FROM hotel_images WHERE hotel_id = h.id LIMIT 1), '/default.jpg') as images 
      FROM bookings b JOIN hotels h ON b.hotel_id = h.id 
      WHERE b.user_id = $1 ORDER BY b.created_at DESC`,
    [userId],
  );
  return result.rows;
};

const createBookingTransaction = async (bookingDetails) => {
  const {
    user_id,
    hotel_id,
    room_type,
    check_in_date,
    check_out_date,
    gst_amount,
    total_price,
    meals,
  } = bookingDetails;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const roomCheck = await client.query(
      "SELECT id, available_rooms FROM hotel_rooms WHERE hotel_id = $1 AND room_type = $2",
      [hotel_id, room_type],
    );

    if (roomCheck.rows.length === 0 || roomCheck.rows[0].available_rooms <= 0) {
      throw new Error("NO_ROOMS_AVAILABLE");
    }

    const newBooking = await client.query(
      `INSERT INTO bookings (
        user_id, hotel_id, check_in_date, check_out_date, gst_amount, total_price, meals, booking_status
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
    const bookingData = newBooking.rows[0];

    await client.query(
      "UPDATE hotel_rooms SET available_rooms = available_rooms - 1 WHERE id = $1",
      [roomCheck.rows[0].id],
    );

    const totalInventory = await client.query(
      "SELECT SUM(available_rooms) as remaining FROM hotel_rooms WHERE hotel_id = $1",
      [hotel_id],
    );
    if (parseInt(totalInventory.rows[0].remaining || 0) === 0) {
      await client.query(
        "UPDATE hotels SET availability_status = 'offline' WHERE id = $1",
        [hotel_id],
      );
    }

    const userResult = await client.query(
      "SELECT email FROM users WHERE id = $1",
      [user_id],
    );
    const email = userResult.rows.length > 0 ? userResult.rows[0].email : null;

    await client.query("COMMIT");
    const finalBookingData = {
      ...bookingData,
      hotel_name: bookingDetails.hotel_name,
      roomType: bookingDetails.room_type,
    };
    return { bookingData: finalBookingData, email };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const getAdminLogs = async (type) => {
  let queryText = `
    SELECT b.*, h.hotel_name 
    FROM bookings b 
    JOIN hotels h ON b.hotel_id = h.id 
  `;

  if (type === "new") {
    queryText +=
      " WHERE b.created_at >= NOW() - INTERVAL '1 day' ORDER BY b.created_at DESC";
  } else if (type === "upcoming") {
    queryText +=
      " WHERE b.check_in_date >= CURRENT_DATE ORDER BY b.check_in_date ASC";
  } else if (type === "past") {
    queryText +=
      " WHERE b.check_out_date < CURRENT_DATE ORDER BY b.check_out_date DESC";
  } else {
    queryText += " ORDER BY b.created_at DESC";
  }

  const logs = await pool.query(queryText);
  return logs.rows;
};

const getPaginatedBookingLogs = async (limit, offset, status, year) => {
  let query = `
    SELECT b.*, h.hotel_name 
    FROM bookings b
    JOIN hotels h ON b.hotel_id = h.id
    WHERE 1=1
  `;
  const params = [];
  let paramCount = 1;

  if (status) {
    query += ` AND b.booking_status = $${paramCount++}`;
    params.push(status);
  }

  if (year) {
    query += ` AND EXTRACT(YEAR FROM b.created_at) = $${paramCount++}`;
    params.push(year);
  }

  query += ` ORDER BY b.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows;
};

const getBookingLogsCount = async (status, year) => {
  let query = "SELECT COUNT(*) FROM bookings b WHERE 1=1";
  const params = [];
  let paramCount = 1;

  if (status) {
    query += ` AND b.booking_status = $${paramCount++}`;
    params.push(status);
  }

  if (year) {
    query += ` AND EXTRACT(YEAR FROM b.created_at) = $${paramCount++}`;
    params.push(year);
  }

  const result = await pool.query(query, params);
  return parseInt(result.rows[0].count);
};

const getFullBookingLogsReport = async (status, year) => {
  let query = `
    SELECT b.*, h.hotel_name,
           SUM(b.total_price) OVER() as grand_total_revenue
    FROM bookings b
    JOIN hotels h ON b.hotel_id = h.id
    WHERE 1=1
  `;
  const params = [];
  let paramCount = 1;

  if (status && status !== "all") {
    query += ` AND b.booking_status = $${paramCount++}`;
    params.push(status);
  }

  if (year) {
    query += ` AND EXTRACT(YEAR FROM b.created_at) = $${paramCount++}`;
    params.push(year);
  }

  query += ` ORDER BY b.created_at DESC`;

  const result = await pool.query(query, params);
  return result.rows;
};

const getBookingsByHotelId = async (hotelId) => {
  const result = await pool.query(
    `SELECT b.*, h.hotel_name 
     FROM bookings b 
     JOIN hotels h ON b.hotel_id = h.id 
     WHERE b.hotel_id = $1 ORDER BY b.created_at DESC`,
    [hotelId],
  );
  return result.rows;
};

const updateBookingStatus = async (id, status) => {
  const updated = await pool.query(
    "UPDATE bookings SET booking_status = $1 WHERE id = $2 RETURNING *",
    [status, id],
  );
  return updated.rows[0];
};

const deleteRoomCategory = async (roomId) => {
  await pool.query("DELETE FROM hotel_rooms WHERE id = $1", [roomId]);
};

const getPaginatedHotelBookings = async (hotelId, limit, offset, isHistory) => {
  let query = `
    SELECT b.*, h.hotel_name 
    FROM bookings b
    JOIN hotels h ON b.hotel_id = h.id
    WHERE b.hotel_id = $1
  `;

  if (isHistory) {
    query += " AND b.booking_status = 'checked_out'";
  } else {
    query += " AND b.booking_status != 'checked_out'";
  }

  query += ` ORDER BY b.created_at DESC LIMIT $2 OFFSET $3`;

  const result = await pool.query(query, [hotelId, limit, offset]);
  return result.rows;
};

const getHotelBookingsCount = async (hotelId, isHistory) => {
  let query = "SELECT COUNT(*) FROM bookings WHERE hotel_id = $1";

  if (isHistory) {
    query += " AND booking_status = 'checked_out'";
  } else {
    query += " AND booking_status != 'checked_out'";
  }

  const result = await pool.query(query, [hotelId]);
  return parseInt(result.rows[0].count);
};

module.exports = {
  createBookingTransaction,
  getMyBookings,
  getUserBookingsById,
  getAdminLogs,
  getBookingsByHotelId,
  updateBookingStatus,
  deleteRoomCategory,
  getPaginatedBookingLogs,
  getBookingLogsCount,
  getPaginatedHotelBookings,
  getHotelBookingsCount,
  getFullBookingLogsReport,
};
