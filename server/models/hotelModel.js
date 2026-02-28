const pool = require("../db");

const getRoomMeals = async (roomId) => {
  const result = await pool.query(
    "SELECT * FROM room_meals WHERE room_id = $1 ORDER BY meal_category, dietary_type",
    [roomId],
  );
  return result.rows;
};

const addRoomMeal = async (room_id, category, type, name, price) => {
  const result = await pool.query(
    "INSERT INTO room_meals (room_id, meal_category, dietary_type, dish_name, price) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [room_id, category, type, name, price || 0],
  );
  return result.rows[0];
};

const deleteRoomMeal = async (dishId) => {
  await pool.query("DELETE FROM room_meals WHERE id = $1", [dishId]);
};

const addHotelTransaction = async (hotelData) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const {
      hotel_name,
      city,
      state,
      description,
      base_price,
      original_base_price,
      amenities,
      meals,
      roomsMetadata,
    } = hotelData;

    const hotelResult = await client.query(
      `INSERT INTO hotels (hotel_name, city, state, description, base_price, original_base_price, amenities, availability_status)  
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'offline') RETURNING id`,
      [
        hotel_name,
        city,
        state,
        description,
        base_price,
        original_base_price || null,
        amenities,
      ],
    );
    const hotelId = hotelResult.rows[0].id;

    if (meals && Array.isArray(meals)) {
      for (const meal of meals) {
        await client.query(
          `INSERT INTO hotel_meals (hotel_id, meal_category, dietary_type, dish_name, price) VALUES ($1, $2, $3, $4, $5)`,
          [
            hotelId,
            meal.meal_category || meal.category,
            meal.dietary_type || meal.type,
            meal.dish_name || meal.name,
            meal.price || 0,
          ],
        );
      }
    }

    await client.query("COMMIT");
    return hotelId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const searchHotels = async (query, state, city) => {
  let sql = `
    SELECT h.*, 
      COALESCE(json_agg(DISTINCT hi.image_url) FILTER (WHERE hi.image_url IS NOT NULL), '[]') as images_from_table,
      COALESCE(json_agg(DISTINCT r.*) FILTER (WHERE r.id IS NOT NULL), '[]') as rooms
    FROM hotels h 
    LEFT JOIN hotel_images hi ON h.id = hi.hotel_id 
    LEFT JOIN hotel_rooms r ON h.id = r.hotel_id
    WHERE h.availability_status = 'online'
  `;
  const params = [];

  if (query) {
    params.push(`%${query}%`);
    sql += ` AND h.hotel_name ILIKE $${params.length}`;
  }
  if (state) {
    params.push(state);
    sql += ` AND h.state = $${params.length}`;
  }
  if (city) {
    params.push(city);
    sql += ` AND h.city = $${params.length}`;
  }

  sql += ` GROUP BY h.id`;
  const result = await pool.query(sql, params);
  return result.rows;
};

const getOnlineHotels = async () => {
  const query = `
    SELECT h.*, 
      COALESCE(json_agg(DISTINCT hi.image_url) FILTER (WHERE hi.image_url IS NOT NULL), '[]') as images_from_table,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', r.id, 'room_type', r.room_type, 'price_per_night', r.price_per_night,
            'original_price', r.original_price, 'bed_type', r.bed_type, 'room_description', r.room_description,
            'available_rooms', r.available_rooms, 'room_images', r.room_images
          )
        ) FILTER (WHERE r.id IS NOT NULL AND r.available_rooms > 0), '[]'
      ) as rooms
    FROM hotels h 
    LEFT JOIN hotel_images hi ON h.id = hi.hotel_id 
    LEFT JOIN hotel_rooms r ON h.id = r.hotel_id
    WHERE h.availability_status = 'online' 
    GROUP BY h.id`;
  const result = await pool.query(query);
  return result.rows;
};

const getAllHotels = async () => {
  const query = `
    SELECT h.*, 
      COALESCE(json_agg(DISTINCT hi.image_url) FILTER (WHERE hi.image_url IS NOT NULL), '[]') as images_from_table,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', r.id, 'room_type', r.room_type, 'price_per_night', r.price_per_night,
            'original_price', r.original_price, 'bed_type', r.bed_type, 'room_description', r.room_description,
            'available_rooms', r.available_rooms, 'room_images', r.room_images
          )
        ) FILTER (WHERE r.id IS NOT NULL), '[]'
      ) as rooms
    FROM hotels h 
    LEFT JOIN hotel_images hi ON h.id = hi.hotel_id 
    LEFT JOIN hotel_rooms r ON h.id = r.hotel_id
    GROUP BY h.id ORDER BY h.id ASC`;
  const result = await pool.query(query);
  return result.rows;
};

const getHotelById = async (id) => {
  const query = `
    SELECT h.*, COALESCE(json_agg(DISTINCT hi.image_url) FILTER (WHERE hi.image_url IS NOT NULL), '[]') as images_from_table
    FROM hotels h 
    LEFT JOIN hotel_images hi ON h.id = hi.hotel_id 
    WHERE h.id = $1 GROUP BY h.id
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

const updateHotelStatus = async (id, status) => {
  await pool.query("UPDATE hotels SET availability_status = $1 WHERE id = $2", [
    status,
    id,
  ]);
};

const updateHotelTransaction = async (id, updateData, files) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const {
      hotel_name,
      base_price,
      original_base_price,
      description,
      amenities,
      keptImages,
    } = updateData;

    await client.query(
      `UPDATE hotels SET hotel_name = $1, base_price = $2, original_base_price = $3, description = $4, amenities = $5 WHERE id = $6`,
      [
        hotel_name,
        base_price,
        original_base_price || null,
        description,
        amenities,
        id,
      ],
    );

    await client.query(
      "DELETE FROM hotel_images WHERE hotel_id = $1 AND image_url != ALL($2::text[])",
      [id, keptImages],
    );

    if (files && files.length > 0) {
      for (const file of files) {
        await client.query(
          "INSERT INTO hotel_images (hotel_id, image_url) VALUES ($1, $2)",
          [id, `/uploads/${file.filename}`],
        );
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const addLocationTransaction = async (country, state, city) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let countryId = null;
    let stateId = null;
    if (country && country.trim() !== "") {
      let countryRes = await client.query(
        "SELECT id FROM countries WHERE country_name = $1",
        [country],
      );
      if (countryRes.rows.length > 0) {
        countryId = countryRes.rows[0].id;
      } else {
        const newCountry = await client.query(
          "INSERT INTO countries (country_name, country_code) VALUES ($1, $2) RETURNING id",
          [country, country.substring(0, 2).toUpperCase()],
        );
        countryId = newCountry.rows[0].id;
      }
    }

    if (state && state.trim() !== "") {
      let stateRes = await client.query(
        "SELECT id FROM states WHERE state_name = $1 AND (country_id = $2 OR (country_id IS NULL AND $2 IS NULL))",
        [state, countryId],
      );
      if (stateRes.rows.length > 0) {
        stateId = stateRes.rows[0].id;
      } else {
        const newState = await client.query(
          "INSERT INTO states (state_name, country_id) VALUES ($1, $2) RETURNING id",
          [state, countryId],
        );
        stateId = newState.rows[0].id;
      }
    }
    if (city && city.trim() !== "") {
      if (!stateId) throw new Error("State is required to add a city.");

      let cityRes = await client.query(
        "SELECT id FROM cities WHERE city_name = $1 AND state_id = $2",
        [city, stateId],
      );

      if (cityRes.rows.length === 0) {
        await client.query(
          "INSERT INTO cities (city_name, state_id) VALUES ($1, $2)",
          [city, stateId],
        );
      } else {
        throw new Error("This city already exists in the selected state.");
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const deleteLocationTransaction = async (country, state, city) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (country && country.trim() !== "") {
      const countryRes = await client.query(
        "SELECT id FROM countries WHERE country_name = $1",
        [country],
      );
      if (countryRes.rows.length > 0) {
        const cId = countryRes.rows[0].id;
        await client.query(
          "DELETE FROM cities WHERE state_id IN (SELECT id FROM states WHERE country_id = $1)",
          [cId],
        );
        await client.query("DELETE FROM states WHERE country_id = $1", [cId]);
        await client.query("DELETE FROM countries WHERE id = $1", [cId]);
      }
    } else if (state && state.trim() !== "") {
      const stateRes = await client.query(
        "SELECT id FROM states WHERE state_name = $1",
        [state],
      );
      if (stateRes.rows.length > 0) {
        const sId = stateRes.rows[0].id;
        await client.query("DELETE FROM cities WHERE state_id = $1", [sId]);
        await client.query("DELETE FROM states WHERE id = $1", [sId]);
      }
    } else if (city && city.trim() !== "") {
      await client.query("DELETE FROM cities WHERE city_name = $1", [city]);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const getPaginatedOnlineHotels = async (limit, offset) => {
  const query = `
    SELECT h.*, 
      COALESCE(json_agg(DISTINCT hi.image_url) FILTER (WHERE hi.image_url IS NOT NULL), '[]') as images_from_table
    FROM hotels h 
    LEFT JOIN hotel_images hi ON h.id = hi.hotel_id 
    WHERE h.availability_status = 'online' 
    GROUP BY h.id
    LIMIT $1 OFFSET $2`;
  const result = await pool.query(query, [limit, offset]);
  return result.rows;
};

const getOnlineHotelsCount = async () => {
  const result = await pool.query(
    "SELECT COUNT(*) FROM hotels WHERE availability_status = 'online'",
  );
  return parseInt(result.rows[0].count);
};

const getLocations = async () => {
  const result = await pool.query(
    `SELECT 
        co.country_name, 
        s.state_name, 
        c.id as city_id,   
        c.city_name, 
        c.status as city_status
     FROM countries co
     FULL OUTER JOIN states s ON co.id = s.country_id
     FULL OUTER JOIN cities c ON s.id = c.state_id
     ORDER BY co.country_name, s.state_name, c.city_name`,
  );
  return result.rows;
};

const getGlobalDishes = async () => {
  const result = await pool.query(
    "SELECT * FROM global_dishes ORDER BY dietary_type, dish_name",
  );
  return result.rows;
};

const addGlobalDish = async (type, name) => {
  await pool.query(
    "INSERT INTO global_dishes (dietary_type, dish_name) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [type, name],
  );
};

const deleteGlobalDish = async (type, name) => {
  await pool.query(
    "DELETE FROM global_dishes WHERE dietary_type = $1 AND dish_name = $2",
    [type, name],
  );
};

const getHotelMeals = async (hotelId) => {
  const result = await pool.query(
    "SELECT * FROM hotel_meals WHERE hotel_id = $1 ORDER BY meal_category",
    [hotelId],
  );
  return result.rows;
};

const addHotelMeal = async (hotelId, category, type, name, price) => {
  const result = await pool.query(
    "INSERT INTO hotel_meals (hotel_id, meal_category, dietary_type, dish_name, price) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [hotelId, category, type, name, price || 0],
  );
  return result.rows[0];
};

const deleteHotelMeal = async (dishId) => {
  await pool.query("DELETE FROM hotel_meals WHERE id = $1", [dishId]);
};

const addHotelRoom = async (
  hotel_id,
  room_type,
  bed_type,
  price_per_night,
  original_price,
  room_description,
  available_rooms,
  roomImages,
) => {
  await pool.query(
    `INSERT INTO hotel_rooms (hotel_id, room_type, bed_type, price_per_night, original_price, room_description, available_rooms, room_images) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      hotel_id,
      room_type,
      bed_type,
      price_per_night,
      original_price || null,
      room_description,
      available_rooms,
      roomImages,
    ],
  );
};

const getPaginatedHotels = async (limit, offset) => {
  const query = `
        SELECT id, hotel_name, city, state, base_price, availability_status 
        FROM hotels 
        ORDER BY id DESC 
        LIMIT $1 OFFSET $2
    `;
  const result = await pool.query(query, [limit, offset]);
  return result.rows;
};

const getHotelsCount = async () => {
  const result = await pool.query("SELECT COUNT(*) FROM hotels");
  return parseInt(result.rows[0].count);
};

const updateHotelRoom = async (
  roomId,
  room_type,
  bed_type,
  price_per_night,
  original_price,
  available_rooms,
  room_description,
  finalImages,
) => {
  await pool.query(
    `UPDATE hotel_rooms SET room_type = $1, bed_type = $2, price_per_night = $3, original_price = $4, available_rooms = $5, room_description = $6, room_images = $7 WHERE id = $8`,
    [
      room_type,
      bed_type,
      price_per_night,
      original_price || null,
      available_rooms,
      room_description,
      finalImages,
      roomId,
    ],
  );
};

const updateDishStatus = async (id, status) => {
  const finalStatus = status || "active";
  const result = await pool.query(
    "UPDATE global_dishes SET status = $1 WHERE id = $2 RETURNING *",
    [finalStatus, id],
  );
  return result.rows[0];
};

const updateCityStatus = async (id, status) => {
  const result = await pool.query(
    "UPDATE cities SET status = $1 WHERE id = $2 RETURNING *",
    [status, id],
  );
  return result.rows[0];
};

const getPaginatedCityDirectory = async (limit, offset) => {
  const query = `
    SELECT 
      co.country_name, 
      s.state_name, 
      c.id as city_id, 
      c.city_name, 
      c.status
    FROM countries co
    JOIN states s ON co.id = s.country_id
    JOIN cities c ON s.id = c.state_id
    ORDER BY co.country_name, s.state_name, c.city_name
    LIMIT $1 OFFSET $2`;
  const result = await pool.query(query, [limit, offset]);
  return result.rows;
};

const getCityCount = async () => {
  const result = await pool.query("SELECT COUNT(*) FROM cities");
  return parseInt(result.rows[0].count);
};

const getPaginatedGlobalDishes = async (limit, offset) => {
  const query = `
    SELECT * FROM global_dishes 
    ORDER BY dietary_type, dish_name 
    LIMIT $1 OFFSET $2
  `;
  const result = await pool.query(query, [limit, offset]);
  return result.rows;
};

const getGlobalDishesCount = async () => {
  const result = await pool.query("SELECT COUNT(*) FROM global_dishes");
  return parseInt(result.rows[0].count);
};

const getPaginatedStaff = async (limit, offset) => {
  const query = `
    SELECT u.id, u.username, u.email, u.phone, u.assigned_hotel_id, h.hotel_name 
    FROM users u
    LEFT JOIN hotels h ON u.assigned_hotel_id = h.id
    WHERE u.user_type = 'Staff' 
    ORDER BY u.id DESC 
    LIMIT $1 OFFSET $2
  `;
  const result = await pool.query(query, [limit, offset]);
  return result.rows;
};

const getStaffCount = async () => {
  const result = await pool.query(
    "SELECT COUNT(*) FROM users WHERE user_type = 'Staff'",
  );
  return parseInt(result.rows[0].count);
};

module.exports = {
  getRoomMeals,
  addRoomMeal,
  deleteRoomMeal,
  getHotelMeals,
  addHotelMeal,
  deleteHotelMeal,
  searchHotels,
  getOnlineHotels,
  getAllHotels,
  getHotelById,
  getPaginatedHotels,
  getHotelsCount,
  getPaginatedOnlineHotels,
  getOnlineHotelsCount,
  updateHotelStatus,
  addHotelTransaction,
  updateHotelTransaction,
  getLocations,
  addLocationTransaction,
  deleteLocationTransaction,
  updateCityStatus,
  getPaginatedCityDirectory,
  getCityCount,
  addHotelRoom,
  updateHotelRoom,
  getGlobalDishes,
  addGlobalDish,
  deleteGlobalDish,
  updateDishStatus,
  getPaginatedGlobalDishes,
  getGlobalDishesCount,
  getPaginatedStaff,
  getStaffCount,
};
