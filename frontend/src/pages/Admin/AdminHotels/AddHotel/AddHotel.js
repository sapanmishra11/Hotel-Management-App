import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  MapPin,
  Bed,
  Utensils,
  ImageIcon,
} from "lucide-react";
import API from "../../../../api/axios";
import { toast } from "react-toastify";
import "./AddHotel.scss";

const AddHotel = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [locationData, setLocationData] = useState({
    states: [],
    stateCityMap: {},
  });

  const [newHotel, setNewHotel] = useState({
    hotel_name: "",
    city: "",
    state: "",
    description: "",
    base_price: "",
    original_base_price: "",
    amenities: "",
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [tempRooms, setTempRooms] = useState([]);
  const [roomData, setRoomData] = useState({
    type: "",
    price: "",
    original_price: "",
    available_rooms: 1,
    desc: "",
  });
  const [roomFiles, setRoomFiles] = useState([]);

  const [tempMeals, setTempMeals] = useState([]);
  const [newDish, setNewDish] = useState({
    category: "breakfast",
    type: "Veg",
    name: "",
    price: "",
  });
  const [standardDishes, setStandardDishes] = useState({
    Veg: [],
    "Non-Veg": [],
  });

  useEffect(() => {
    fetchLocations();
    fetchGlobalDishes();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await API.get("api/hotels/locations");
      setLocationData(res.data);
    } catch (err) {
      console.error("Location Error:", err);
      toast.error("Failed to load locations");
    }
  };

  const fetchGlobalDishes = async () => {
    try {
      const res = await API.get("api/hotels/global-dishes");
      const formatted = res.data.reduce(
        (acc, dish) => {
          const type = dish.dietary_type === "Veg" ? "Veg" : "Non-Veg";
          acc[type].push(dish.dish_name);
          return acc;
        },
        { Veg: [], "Non-Veg": [] },
      );
      setStandardDishes(formatted);
    } catch (err) {
      console.error("Global Dish Error:", err);
    }
  };

  const handleAddHotel = async (e) => {
    e.preventDefault();
    if (
      !newHotel.hotel_name ||
      !newHotel.city ||
      !newHotel.state ||
      !newHotel.base_price
    ) {
      return toast.warn("Please fill in all required basic details.");
    }

    setIsProcessing(true);
    const formData = new FormData();
    const amenitiesArray = newHotel.amenities
      ? newHotel.amenities.split(",").map((a) => a.trim())
      : [];

    Object.keys(newHotel).forEach((key) => {
      if (key !== "amenities") formData.append(key, newHotel[key]);
    });
    formData.append("amenities", JSON.stringify(amenitiesArray));
    selectedFiles.forEach((file) => formData.append("images", file));

    const roomsMetadata = tempRooms.map((r) => ({
      room_type: r.type,
      price_per_night: r.price,
      original_price: r.original_price,
      room_description: r.desc,
      available_rooms: r.available_rooms,
      fileCount: r.files.length,
    }));
    formData.append("roomsMetadata", JSON.stringify(roomsMetadata));
    tempRooms.forEach((r) =>
      r.files.forEach((f) => formData.append("roomImages", f)),
    );

    const formattedMeals = tempMeals.map((m) => ({
      dish_name: m.name,
      dietary_type: m.type,
      meal_category: m.category,
      price: m.price || 0,
    }));
    formData.append("meals", JSON.stringify(formattedMeals));

    try {
      await API.post("api/hotels/add", formData);
      toast.success("Hotel Registered Successfully!");
      navigate("/admin/hotels");
    } catch (err) {
      toast.error(err.response?.data?.error || "Submission failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="form-header-toolbar">
        <button onClick={() => navigate(-1)} className="back-link">
          <ArrowLeft size={16} /> Back to Hotels list
        </button>
      </div>

      <div className="table-wrapper boxed-layout">
        <div className="table-header">
          <div className="title-section">
            <h2>Add New Property</h2>
            <p>
              Complete the details below to publish this hotel to the platform
            </p>
          </div>
          <div className="header-actions">
            <button
              className="add-btn"
              onClick={handleAddHotel}
              disabled={isProcessing}
            >
              <Save size={16} />{" "}
              {isProcessing ? "Processing..." : "Publish Hotel"}
            </button>
          </div>
        </div>

        <div className="form-sections">
          <div className="form-card">
            <h4 className="section-title">
              <MapPin size={14} /> 1. Basic Information & Location
            </h4>
            <div className="form-grid">
              <div className="input-field">
                <label>Hotel Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter hotel name"
                  value={newHotel.hotel_name}
                  onChange={(e) =>
                    setNewHotel({ ...newHotel, hotel_name: e.target.value })
                  }
                />
              </div>
              <div className="input-field">
                <label>Offer Price (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="Display price"
                  value={newHotel.base_price}
                  onChange={(e) =>
                    setNewHotel({ ...newHotel, base_price: e.target.value })
                  }
                />
              </div>
              <div className="input-field">
                <label>Original Price (₹)</label>
                <input
                  type="number"
                  placeholder="Strike-through price"
                  value={newHotel.original_base_price}
                  onChange={(e) =>
                    setNewHotel({
                      ...newHotel,
                      original_base_price: e.target.value,
                    })
                  }
                />
              </div>
              <div className="input-field">
                <label>Amenities</label>
                <input
                  type="text"
                  placeholder="WiFi, Parking, Pool (comma separated)"
                  value={newHotel.amenities}
                  onChange={(e) =>
                    setNewHotel({ ...newHotel, amenities: e.target.value })
                  }
                />
              </div>
              <div className="input-field">
                <label>State *</label>
                <select
                  required
                  value={newHotel.state}
                  onChange={(e) =>
                    setNewHotel({
                      ...newHotel,
                      state: e.target.value,
                      city: "",
                    })
                  }
                >
                  <option value="">Select State</option>
                  {locationData.states?.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-field">
                <label>City *</label>
                <select
                  required
                  value={newHotel.city}
                  disabled={!newHotel.state}
                  onChange={(e) =>
                    setNewHotel({ ...newHotel, city: e.target.value })
                  }
                >
                  <option value="">Select City</option>
                  {newHotel.state &&
                    locationData.stateCityMap?.[newHotel.state]?.map((c) => (
                      <option key={c.id || c.city_name} value={c.city_name}>
                        {c.city_name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="input-field full-width">
                <label>Description (Max 300 characters) *</label>
                <textarea
                  rows="3"
                  maxLength="300"
                  placeholder="Briefly describe the property..."
                  value={newHotel.description}
                  onChange={(e) =>
                    setNewHotel({ ...newHotel, description: e.target.value })
                  }
                />
                <small className="char-count">
                  {newHotel.description.length}/300
                </small>
              </div>
              <div className="input-field full-width">
                <label>Upload Hotel Images</label>
                <div className="file-drop-zone">
                  <input
                    type="file"
                    multiple
                    onChange={(e) =>
                      setSelectedFiles([
                        ...selectedFiles,
                        ...Array.from(e.target.files),
                      ])
                    }
                  />
                  <p>{selectedFiles.length} images selected</p>
                </div>
              </div>
            </div>
          </div>

          <div className="form-card">
            <h4 className="section-title">
              <Bed size={14} /> 2. Room Category Inventory
            </h4>
            <div className="staging-form">
              <div className="form-grid">
                <div className="input-field">
                  <label>Room Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Deluxe Suite"
                    value={roomData.type}
                    onChange={(e) =>
                      setRoomData({ ...roomData, type: e.target.value })
                    }
                  />
                </div>
                <div className="input-field">
                  <label>Offer Price</label>
                  <input
                    type="number"
                    placeholder="₹"
                    value={roomData.price}
                    onChange={(e) =>
                      setRoomData({ ...roomData, price: e.target.value })
                    }
                  />
                </div>
                <div className="input-field">
                  <label>Quantity</label>
                  <input
                    type="number"
                    value={roomData.available_rooms}
                    onChange={(e) =>
                      setRoomData({
                        ...roomData,
                        available_rooms: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="input-field">
                  <label>Room Images</label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) =>
                      setRoomFiles([...Array.from(e.target.files)])
                    }
                  />
                </div>
              </div>
              <button
                type="button"
                className="btn-stage"
                onClick={() => {
                  if (!roomData.type || !roomData.price)
                    return toast.error("Type and Price are required.");
                  setTempRooms([
                    ...tempRooms,
                    { ...roomData, id: Date.now(), files: [...roomFiles] },
                  ]);
                  setRoomData({
                    type: "",
                    price: "",
                    original_price: "",
                    available_rooms: 1,
                    desc: "",
                  });
                  setRoomFiles([]);
                }}
              >
                <Plus size={14} /> Add Category to List
              </button>
            </div>

            {tempRooms.length > 0 && (
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tempRooms.map((r) => (
                    <tr key={r.id}>
                      <td>{r.type}</td>
                      <td>₹{r.price}</td>
                      <td>{r.available_rooms} Units</td>
                      <td>
                        <Trash2
                          size={14}
                          className="del-icon"
                          onClick={() =>
                            setTempRooms(tempRooms.filter((x) => x.id !== r.id))
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="form-card">
            <h4 className="section-title">
              <Utensils size={14} /> 3. Meal Menu Planning
            </h4>
            <div className="staging-form">
              <div className="form-grid">
                <div className="input-field">
                  <label>Meal Category</label>
                  <select
                    value={newDish.category}
                    onChange={(e) =>
                      setNewDish({ ...newDish, category: e.target.value })
                    }
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                  </select>
                </div>
                <div className="input-field">
                  <label>Type</label>
                  <select
                    value={newDish.type}
                    onChange={(e) =>
                      setNewDish({ ...newDish, type: e.target.value, name: "" })
                    }
                  >
                    <option value="Veg">Veg</option>
                    <option value="Non-Veg">Non-Veg</option>
                  </select>
                </div>
                <div className="input-field">
                  <label>Select Dish</label>
                  <select
                    value={newDish.name}
                    onChange={(e) =>
                      setNewDish({ ...newDish, name: e.target.value })
                    }
                  >
                    <option value="">Choose dish...</option>
                    {standardDishes[newDish.type]?.map((d, i) => (
                      <option key={i} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-field">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    placeholder="₹"
                    value={newDish.price}
                    onChange={(e) =>
                      setNewDish({ ...newDish, price: e.target.value })
                    }
                  />
                </div>
              </div>
              <button
                type="button"
                className="btn-stage"
                onClick={() => {
                  if (!newDish.name || !newDish.price)
                    return toast.error("Select dish and price.");
                  setTempMeals([...tempMeals, { ...newDish, id: Date.now() }]);
                  setNewDish({
                    ...newDish,
                    category: "breakfast",
                    type: "Veg",
                    name: "",
                    price: "",
                  });
                }}
              >
                <Plus size={14} /> Add Dish to Menu
              </button>
            </div>

            {tempMeals.length > 0 && (
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Dish Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tempMeals.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <span className={`dot ${m.type.toLowerCase()}`}>●</span>{" "}
                        {m.name}
                      </td>
                      <td className="capitalize">{m.category}</td>
                      <td>₹{m.price}</td>
                      <td>
                        <Trash2
                          size={14}
                          className="del-icon"
                          onClick={() =>
                            setTempMeals(tempMeals.filter((x) => x.id !== m.id))
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddHotel;
