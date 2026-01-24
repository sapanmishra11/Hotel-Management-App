const express = require("express");
const router = express.Router();
const pool = require("../db");
const authorize = require("../middleware/authorize");

router.post("/add", authorize("Admin"), async (req, res) => {
  try {
    const {
      hotel_name,
      city,
      state,
      description,
      base_price,
      amenities,
      images,
      availability_status,
    } = req.body;

    const newHotel = await pool.query(
      `INSERT INTO hotels (
        hotel_name, city, state, description, base_price, amenities, images, availability_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        hotel_name,
        city,
        state,
        description,
        base_price || 0,
        amenities || [],
        images || [],
        availability_status || "offline",
      ],
    );

    res.json(newHotel.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

router.get("/online", async (req, res) => {
  try {
    const allHotels = await pool.query(
      "SELECT * FROM hotels WHERE availability_status = 'online'",
    );
    res.json(allHotels.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.get("/all", authorize("Admin"), async (req, res) => {
  try {
    const allHotels = await pool.query("SELECT * FROM hotels ORDER BY id ASC");
    res.json(allHotels.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

router.patch("/status/:id", authorize("Admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedHotel = await pool.query(
      "UPDATE hotels SET availability_status = $1 WHERE id = $2 RETURNING *",
      [status, id],
    );

    if (updatedHotel.rows.length === 0) {
      return res.status(404).json("Hotel not found");
    }

    res.json(updatedHotel.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

router.get("/search", async (req, res) => {
  const { location, state, city, query } = req.query;

  try {
    let sql = "SELECT * FROM hotels WHERE availability_status = 'online'";
    const params = [];
    let paramIndex = 1;

    if (state) {
      sql += ` AND state = $${paramIndex}`;
      params.push(state);
      paramIndex++;
    }

    if (city) {
      sql += ` AND city = $${paramIndex}`;
      params.push(city);
      paramIndex++;
    }

    if (query) {
      sql += ` AND (hotel_name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${query}%`);
      paramIndex++;
    }

    if (!state && !city && !query && location) {
      sql += ` AND (city ILIKE $${paramIndex} OR state ILIKE $${paramIndex} OR hotel_name ILIKE $${paramIndex})`;
      params.push(`%${location}%`);
    }

    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Search Error:", err.message);
    res.status(500).json("Server Error");
  }
});

module.exports = router;
