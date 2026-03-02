const hotelModel = require("../models/hotelModel");

const fetchRoomMeals = async (req, res) => {
  try {
    const meals = await hotelModel.getRoomMeals(req.params.roomId);
    res.json(meals);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Error fetching room meals");
  }
};

const createRoomMeal = async (req, res) => {
  try {
    const { room_id, category, type, name, price } = req.body;
    const newMeal = await hotelModel.addRoomMeal(
      room_id,
      category,
      type,
      name,
      price,
    );
    res.json(newMeal);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Error adding room meal item");
  }
};

const removeRoomMeal = async (req, res) => {
  try {
    await hotelModel.deleteRoomMeal(req.params.dishId);
    res.json({ message: "Dish deleted from room" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Error deleting room meal item");
  }
};

const createHotel = async (req, res) => {
  try {
    const {
      hotel_name,
      city,
      state,
      description,
      base_price,
      original_base_price,
      amenities,
      roomsMetadata,
      meals,
    } = req.body;

    const parsedAmenities =
      typeof amenities === "string" ? JSON.parse(amenities) : amenities;
    const parsedMeals = typeof meals === "string" ? JSON.parse(meals) : meals;
    const parsedRooms =
      typeof roomsMetadata === "string" ? JSON.parse(roomsMetadata) : [];

    const hotelData = {
      hotel_name,
      city,
      state,
      description,
      base_price,
      original_base_price,
      amenities: parsedAmenities,
      meals: parsedMeals,
      roomsMetadata: parsedRooms,
    };

    const hotelId = await hotelModel.addHotelTransaction(hotelData);
    res.json({
      message: "Hotel, Rooms, and Meals added successfully",
      id: hotelId,
    });
  } catch (err) {
    console.error("Critical Error in /add:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

const searchHotels = async (req, res) => {
  try {
    const { query, state, city } = req.query;
    const hotels = await hotelModel.searchHotelsButOnlineCities(
      query,
      state,
      city,
    );
    res.json(hotels);
  } catch (err) {
    console.error(err);
    res.status(500).json("Search Error");
  }
};

const fetchOnlineHotels = async (req, res) => {
  try {
    const hotels = await hotelModel.getOnlineHotels();
    res.json(hotels);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
};

const fetchAllHotels = async (req, res) => {
  try {
    const hotels = await hotelModel.getAllHotels();
    res.json(hotels);
  } catch (err) {
    console.error("Fetch All Hotels Error:", err);
    res.status(500).json("Error fetching hotels");
  }
};

const getHotelReport = async (req, res) => {
  try {
    const hotels = await hotelModel.getHotelsForExport();

    res.status(200).json({
      success: true,
      hotels: hotels,
    });
  } catch (err) {
    console.error("Controller Error (getHotelReport):", err.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

const fetchHotelById = async (req, res) => {
  try {
    const hotel = await hotelModel.getHotelById(req.params.id);
    if (!hotel) return res.status(404).json("Hotel not found");
    res.json(hotel);
  } catch (err) {
    res.status(500).json("Error fetching hotel");
  }
};

const updateStatus = async (req, res) => {
  try {
    await hotelModel.updateHotelStatus(req.params.id, req.body.status);
    res.json({ message: "OK" });
  } catch (err) {
    res.status(500).json("Error updating status");
  }
};

const updateHotel = async (req, res) => {
  try {
    const {
      hotel_name,
      base_price,
      original_base_price,
      description,
      amenities,
      state,
      city,
      existingImages,
      rooms,
      meals,
    } = req.body;

    const parsedAmenities =
      typeof amenities === "string" ? JSON.parse(amenities) : amenities;
    const keptImages = JSON.parse(existingImages || "[]");

    const parsedRooms =
      typeof rooms === "string" ? JSON.parse(rooms) : rooms || [];
    const parsedMeals =
      typeof meals === "string" ? JSON.parse(meals) : meals || [];

    const updateData = {
      hotel_name,
      base_price,
      original_base_price,
      description,
      state,
      city,
      amenities: parsedAmenities,
      keptImages,
      rooms: parsedRooms,
      meals: parsedMeals,
    };

    await hotelModel.updateHotelTransaction(
      req.params.id,
      updateData,
      req.files,
    );

    res.json({ message: "Hotel, Rooms, and Meals updated successfully" });
  } catch (err) {
    console.error("Update Controller Error:", err);
    res
      .status(500)
      .json({ error: "Server Error during update", details: err.message });
  }
};

const addLocation = async (req, res) => {
  try {
    const { country, state, city } = req.body;
    await hotelModel.addLocationTransaction(country, state, city);
    res.json({ message: "Location data processed successfully" });
  } catch (err) {
    if (err.message === "This city already exists.") {
      return res.status(400).json({ error: err.message });
    }
    console.error("Location Add Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

const deleteLocation = async (req, res) => {
  try {
    const { country, state, city } = req.body;

    if (!country && !state && !city) {
      return res
        .status(400)
        .json({ error: "Please provide a country, state, or city to delete." });
    }

    await hotelModel.deleteLocationTransaction(country, state, city);
    res.json({ message: "Location data deleted successfully" });
  } catch (err) {
    console.error("Location Delete Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

const fetchLocations = async (req, res) => {
  try {
    const rawRows = await hotelModel.getAllLocationsButOnlineCities();

    const countries = new Set();
    const states = new Set();
    const cities = new Set();
    const stateCityMap = {};
    const countryStateMap = {};

    rawRows.forEach((row) => {
      if (row.country_name) {
        countries.add(row.country_name);
        if (!countryStateMap[row.country_name])
          countryStateMap[row.country_name] = [];

        if (
          row.state_name &&
          !countryStateMap[row.country_name].includes(row.state_name)
        ) {
          countryStateMap[row.country_name].push(row.state_name);
        }
      }

      if (row.state_name) {
        states.add(row.state_name);
        if (!stateCityMap[row.state_name]) stateCityMap[row.state_name] = [];

        if (row.city_name) {
          const cityExists = stateCityMap[row.state_name].some(
            (c) => c.city_name === row.city_name,
          );

          if (!cityExists) {
            stateCityMap[row.state_name].push({
              id: row.city_id,
              city_name: row.city_name,
              status: row.city_status || "active",
            });
          }
          cities.add(row.city_name);
        }
      }
    });

    res.json({
      countries: Array.from(countries).filter(Boolean).sort(),
      states: Array.from(states).filter(Boolean).sort(),
      cities: Array.from(cities).filter(Boolean).sort(),
      stateCityMap,
      countryStateMap,
    });
  } catch (err) {
    console.error("Locations Fetch Error:", err);
    res.status(500).send("Error fetching locations");
  }
};

const getLocationReport = async (req, res) => {
  try {
    const locations = await hotelModel.getFullLocationReport();

    res.status(200).json({
      success: true,
      locations: locations,
    });
  } catch (err) {
    console.error("Location Report Controller Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getGlobalDishReport = async (req, res) => {
  try {
    const dishes = await hotelModel.getFullGlobalDishReport();

    res.status(200).json({
      success: true,
      dishes: dishes,
    });
  } catch (err) {
    console.error("Dish Report Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const fetchGlobalDishes = async (req, res) => {
  try {
    const dishes = await hotelModel.getActiveGlobalDishes();
    res.json(dishes);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Error fetching global dishes");
  }
};

const createGlobalDish = async (req, res) => {
  try {
    const { type, name } = req.body;
    await hotelModel.addGlobalDish(type, name);
    res.json({ message: "Global dish added" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Error adding global dish");
  }
};

const removeGlobalDish = async (req, res) => {
  try {
    const { type, name } = req.params;
    await hotelModel.deleteGlobalDish(type, name);
    res.json({ message: "Global dish deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Error deleting global dish");
  }
};

const fetchHotelMeals = async (req, res) => {
  try {
    const meals = await hotelModel.getHotelMeals(req.params.hotelId);
    res.json(meals);
  } catch (err) {
    res.status(500).json("Error fetching hotel meals");
  }
};

const createHotelMeal = async (req, res) => {
  try {
    const { category, type, name, price } = req.body;
    const newMeal = await hotelModel.addHotelMeal(
      req.params.hotelId,
      category,
      type,
      name,
      price,
    );
    res.json(newMeal);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Error adding meal to hotel");
  }
};

const removeHotelMeal = async (req, res) => {
  try {
    await hotelModel.deleteHotelMeal(req.params.dishId);
    res.json({ message: "Dish removed from hotel" });
  } catch (err) {
    res.status(500).json("Error deleting hotel meal");
  }
};

const createHotelRoom = async (req, res) => {
  try {
    const {
      hotel_id,
      room_type,
      bed_type,
      price_per_night,
      original_price,
      available_rooms,
      room_description,
    } = req.body;
    const roomImages = req.files.map((f) => `/uploads/${f.filename}`);

    await hotelModel.addHotelRoom(
      hotel_id,
      room_type,
      bed_type,
      price_per_night,
      original_price,
      room_description,
      available_rooms,
      roomImages,
    );
    res.json({ message: "Room category added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error adding room category");
  }
};

const updateHotelRoom = async (req, res) => {
  try {
    const {
      room_type,
      bed_type,
      price_per_night,
      original_price,
      available_rooms,
      room_description,
      existingImages,
    } = req.body;
    const keptImages = JSON.parse(existingImages || "[]");
    const newFiles = req.files
      ? req.files.map((f) => `/uploads/${f.filename}`)
      : [];
    const finalImages = [...keptImages, ...newFiles];

    await hotelModel.updateHotelRoom(
      req.params.roomId,
      room_type,
      bed_type,
      price_per_night,
      original_price,
      available_rooms,
      room_description,
      finalImages,
    );
    res.json({ message: "Room updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json("Error updating room");
  }
};

const getHotels = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const hotels = await hotelModel.getPaginatedHotels(limit, offset);
    const totalCount = await hotelModel.getHotelsCount();

    res.status(200).json({
      success: true,
      hotels: hotels,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit: limit,
      },
    });
  } catch (err) {
    console.error("Controller Error (getHotels):", err.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

const toggleGlobalDishStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedDish = await hotelModel.updateDishStatus(id, status);

    if (!updatedDish) {
      return res.status(404).json({
        success: false,
        error: "Dish not found",
      });
    }

    res.json({
      success: true,
      message: "Dish status updated successfully",
      dish: updatedDish,
    });
  } catch (err) {
    console.error("Controller Error (toggleGlobalDishStatus):", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const fetchOnlineHotelsPaginated = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [hotels, totalCount] = await Promise.all([
      hotelModel.getPaginatedOnlineHotels(limit, offset),
      hotelModel.getOnlineHotelsCount(),
    ]);

    res.json({
      success: true,
      hotels,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      },
    });
  } catch (err) {
    res.status(500).send("Error fetching hotels");
  }
};

const toggleCityStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedCity = await hotelModel.updateCityStatus(id, status);

    if (!updatedCity) {
      return res.status(404).json({
        success: false,
        error: "City not found",
      });
    }

    res.json({
      success: true,
      message: "City status updated successfully",
      city: updatedCity,
    });
  } catch (err) {
    console.error("Controller Error (toggleCityStatus):", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const fetchLocationsPaginated = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [rows, totalCount] = await Promise.all([
      hotelModel.getPaginatedCityDirectory(limit, offset),
      hotelModel.getCityCount(),
    ]);

    res.json({
      success: true,
      locations: rows,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
};

const fetchGlobalDishesPaginated = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [dishes, totalCount] = await Promise.all([
      hotelModel.getPaginatedGlobalDishes(limit, offset),
      hotelModel.getGlobalDishesCount(),
    ]);

    res.json({
      success: true,
      dishes,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
};

const fetchStaffById = async (req, res) => {
  try {
    const staff = await hotelModel.getStaffById(req.params.id);
    if (!staff)
      return res
        .status(404)
        .json({ success: false, message: "Staff not found" });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const updateStaff = async (req, res) => {
  try {
    const updatedStaff = await hotelModel.updateStaffData(
      req.params.id,
      req.body,
    );
    res.json({ success: true, message: "Staff updated", staff: updatedStaff });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const fetchStaffPaginated = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [staff, totalCount] = await Promise.all([
      hotelModel.getPaginatedStaff(limit, offset),
      hotelModel.getStaffCount(),
    ]);

    res.json({
      success: true,
      staff: staff,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit: limit,
      },
    });
  } catch (err) {
    console.error("Fetch Staff Error:", err.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

module.exports = {
  createHotel,
  searchHotels,
  fetchOnlineHotels,
  fetchOnlineHotelsPaginated,
  fetchAllHotels,
  getHotelReport,
  fetchHotelById,
  updateStatus,
  updateHotel,
  createHotelRoom,
  updateHotelRoom,
  fetchLocations,
  getLocationReport,
  addLocation,
  deleteLocation,
  getHotels,
  toggleCityStatus,
  fetchHotelMeals,
  createHotelMeal,
  removeHotelMeal,
  fetchRoomMeals,
  createRoomMeal,
  removeRoomMeal,
  fetchLocationsPaginated,
  fetchStaffPaginated,
  fetchStaffById,
  updateStaff,
  getGlobalDishReport,
  fetchGlobalDishes,
  toggleGlobalDishStatus,
  createGlobalDish,
  removeGlobalDish,
  fetchGlobalDishesPaginated,
};
