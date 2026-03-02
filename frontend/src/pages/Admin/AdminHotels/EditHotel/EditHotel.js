import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  MapPin,
  Bed,
  Utensils,
  Image as ImageIcon,
  Edit,
} from "lucide-react";
import API from "../../../../api/axios";
import { toast } from "react-toastify";
import "./EditHotel.scss";

const EditHotel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [locationData, setLocationData] = useState({
    states: [],
    stateCityMap: {},
  });
  const serverUrl = process.env.REACT_APP_API_URL;

  const [hotelData, setHotelData] = useState({
    hotel_name: "",
    city: "",
    state: "",
    description: "",
    base_price: "",
    original_base_price: "",
    amenities: "",
  });
  const [existingImages, setExistingImages] = useState([]);
  const [newEditFiles, setNewEditFiles] = useState([]);

  const [rooms, setRooms] = useState([]);
  const [roomData, setRoomData] = useState({
    type: "",
    price: "",
    original_price: "",
    available_rooms: 1,
    desc: "",
  });
  const [roomFiles, setRoomFiles] = useState([]);
  const [editingRoom, setEditingRoom] = useState(null);

  const [hotelMeals, setHotelMeals] = useState([]);
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
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      const locRes = await API.get("api/hotels/locations");
      setLocationData(locRes.data);

      const dishRes = await API.get("api/hotels/global-dishes");
      const formatted = dishRes.data.reduce(
        (acc, dish) => {
          const type = dish.dietary_type === "Veg" ? "Veg" : "Non-Veg";
          acc[type].push(dish.dish_name);
          return acc;
        },
        { Veg: [], "Non-Veg": [] },
      );
      setStandardDishes(formatted);

      const allHotelsRes = await API.get("api/hotels/all");
      const targetHotel = allHotelsRes.data.find(
        (h) => h.id.toString() === id.toString(),
      );

      if (targetHotel) {
        setHotelData({
          hotel_name: targetHotel.hotel_name || "",
          city: targetHotel.city || "",
          state: targetHotel.state || "",
          description: targetHotel.description || "",
          base_price: targetHotel.base_price || "",
          original_base_price: targetHotel.original_base_price || "",
          amenities: Array.isArray(targetHotel.amenities)
            ? targetHotel.amenities.join(", ")
            : targetHotel.amenities || "",
        });
        setExistingImages(targetHotel.images_from_table || []);
        setRooms(targetHotel.rooms || []);
      }

      fetchHotelMeals(id);
    } catch (err) {
      toast.error("Failed to load existing property data");
    }
  };

  const fetchHotelMeals = async (hotelId) => {
    try {
      const res = await API.get(`api/hotels/meals/${hotelId}`);
      setHotelMeals(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateHotel = async (e) => {
    e.preventDefault();
    if (hotelData.description?.length > 300)
      return toast.warn("Description max 300 characters!");

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("hotel_name", hotelData.hotel_name);
    formData.append("base_price", hotelData.base_price);
    formData.append("original_base_price", hotelData.original_base_price || "");
    formData.append("description", hotelData.description);
    formData.append("state", hotelData.state);
    formData.append("city", hotelData.city);

    const finalAmenities = Array.isArray(hotelData.amenities)
      ? hotelData.amenities
      : hotelData.amenities
          .split(",")
          .map((a) => a.trim())
          .filter((a) => a !== "");

    formData.append("amenities", JSON.stringify(finalAmenities));
    formData.append("existingImages", JSON.stringify(existingImages));
    newEditFiles.forEach((file) => formData.append("images", file));

    formData.append("rooms", JSON.stringify(rooms));
    formData.append("meals", JSON.stringify(hotelMeals));

    try {
      await API.put(`api/hotels/update/${id}`, formData);
      toast.success("Hotel updated successfully!");
      navigate("/admin/hotels");
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddRoomTypeToExisting = () => {
    if (!roomData.type || !roomData.price)
      return toast.warn("Type and Offer Price required");

    const newRoom = {
      id: `temp-${Date.now()}`,
      room_type: roomData.type,
      price_per_night: roomData.price,
      original_price: roomData.original_price,
      available_rooms: roomData.available_rooms,
      room_description: roomData.desc,
      isNew: true,
    };

    setRooms([...rooms, newRoom]);
    setRoomData({
      type: "",
      price: "",
      original_price: "",
      available_rooms: 1,
      desc: "",
    });
    setRoomFiles([]);
  };

  const handleUpdateExistingRoom = () => {
    const updatedRooms = rooms.map((r) =>
      r.id === editingRoom.id ? { ...editingRoom, isUpdated: true } : r,
    );
    setRooms(updatedRooms);
    setEditingRoom(null);
  };

  const handleDeleteRoom = (roomId) => {
    setRooms(rooms.filter((r) => r.id !== roomId));
  };

  const handleAddDish = () => {
    if (!newDish.name || !newDish.price)
      return toast.warn("Select a dish and enter a price first");

    const newMeal = {
      id: `temp-${Date.now()}`,
      dish_name: newDish.name,
      meal_category: newDish.category,
      dietary_type: newDish.type,
      price: newDish.price,
      isNew: true,
    };

    setHotelMeals([...hotelMeals, newMeal]);
    setNewDish({ ...newDish, name: "", price: "" });
  };

  const handleDeleteDish = (dishId) => {
    setHotelMeals(hotelMeals.filter((m) => m.id !== dishId));
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
            <h2>Editing: {hotelData.hotel_name || "Loading..."}</h2>
            <p>
              Modify details, rooms, and meals. Changes apply only when you
              click Save.
            </p>
          </div>
          <button
            className="add-btn"
            onClick={handleUpdateHotel}
            disabled={isProcessing}
          >
            <Save size={16} />{" "}
            {isProcessing ? "Processing..." : "Save Hotel Details"}
          </button>
        </div>

        <div className="form-sections">
          <div className="form-card">
            <h4 className="section-title">
              <MapPin size={14} /> 1. Core Property Information
            </h4>
            <div className="form-grid">
              <div className="input-field">
                <label>Hotel Name</label>
                <input
                  type="text"
                  value={hotelData.hotel_name}
                  onChange={(e) =>
                    setHotelData({ ...hotelData, hotel_name: e.target.value })
                  }
                />
              </div>
              <div className="input-field">
                <label>Offer Price (₹)</label>
                <input
                  type="number"
                  value={hotelData.base_price}
                  onChange={(e) =>
                    setHotelData({ ...hotelData, base_price: e.target.value })
                  }
                />
              </div>
              <div className="input-field">
                <label>Original Price (₹)</label>
                <input
                  type="number"
                  value={hotelData.original_base_price}
                  onChange={(e) =>
                    setHotelData({
                      ...hotelData,
                      original_base_price: e.target.value,
                    })
                  }
                />
              </div>
              <div className="input-field">
                <label>Amenities</label>
                <input
                  type="text"
                  value={hotelData.amenities}
                  onChange={(e) =>
                    setHotelData({ ...hotelData, amenities: e.target.value })
                  }
                />
              </div>
              <div className="input-field">
                <label>State</label>
                <select
                  value={hotelData.state}
                  onChange={(e) =>
                    setHotelData({
                      ...hotelData,
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
                <label>City</label>
                <select
                  value={hotelData.city}
                  disabled={!hotelData.state}
                  onChange={(e) =>
                    setHotelData({ ...hotelData, city: e.target.value })
                  }
                >
                  <option value="">Select City</option>
                  {hotelData.state &&
                    locationData.stateCityMap?.[hotelData.state]?.map((c) => (
                      <option key={c.id || c.city_name} value={c.city_name}>
                        {c.city_name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="input-field full-width">
                <label>Description</label>
                <textarea
                  rows="3"
                  maxLength="300"
                  value={hotelData.description}
                  onChange={(e) =>
                    setHotelData({ ...hotelData, description: e.target.value })
                  }
                />
                <small className="char-count">
                  {hotelData.description?.length || 0}/300
                </small>
              </div>
            </div>
          </div>

          <div className="form-card">
            <h4 className="section-title">
              <ImageIcon size={14} /> 2. Gallery Management
            </h4>
            <div className="image-edit-grid">
              {existingImages.map((img, idx) => (
                <div key={idx} className="thumb-box">
                  <img src={`${serverUrl}${img}`} alt="hotel" />
                  <button
                    type="button"
                    className="del-img"
                    onClick={() =>
                      setExistingImages(
                        existingImages.filter((_, i) => i !== idx),
                      )
                    }
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="input-field mt-4">
              <label>Upload New Additional Images</label>
              <input
                type="file"
                multiple
                onChange={(e) =>
                  setNewEditFiles([
                    ...newEditFiles,
                    ...Array.from(e.target.files),
                  ])
                }
              />
            </div>
          </div>

          <div className="form-card">
            <h4 className="section-title">
              <Bed size={14} /> 3. Room Inventory (Staged Changes)
            </h4>

            <div className={`staging-form ${editingRoom ? "is-editing" : ""}`}>
              <h5
                style={{
                  marginTop: 0,
                  marginBottom: "15px",
                  color: editingRoom ? "#d97706" : "#2563eb",
                }}
              >
                {editingRoom
                  ? `Editing: ${editingRoom.room_type}`
                  : "Add New Room Category"}
              </h5>
              <div className="form-grid">
                <div className="input-field">
                  <label>Room Type</label>
                  <input
                    type="text"
                    value={editingRoom ? editingRoom.room_type : roomData.type}
                    onChange={(e) =>
                      editingRoom
                        ? setEditingRoom({
                            ...editingRoom,
                            room_type: e.target.value,
                          })
                        : setRoomData({ ...roomData, type: e.target.value })
                    }
                  />
                </div>
                <div className="input-field">
                  <label>Offer Price</label>
                  <input
                    type="number"
                    value={
                      editingRoom ? editingRoom.price_per_night : roomData.price
                    }
                    onChange={(e) =>
                      editingRoom
                        ? setEditingRoom({
                            ...editingRoom,
                            price_per_night: e.target.value,
                          })
                        : setRoomData({ ...roomData, price: e.target.value })
                    }
                  />
                </div>
                <div className="input-field">
                  <label>Original Price</label>
                  <input
                    type="number"
                    value={
                      editingRoom
                        ? editingRoom.original_price
                        : roomData.original_price
                    }
                    onChange={(e) =>
                      editingRoom
                        ? setEditingRoom({
                            ...editingRoom,
                            original_price: e.target.value,
                          })
                        : setRoomData({
                            ...roomData,
                            original_price: e.target.value,
                          })
                    }
                  />
                </div>
                <div className="input-field">
                  <label>Quantity</label>
                  <input
                    type="number"
                    value={
                      editingRoom
                        ? editingRoom.available_rooms
                        : roomData.available_rooms
                    }
                    onChange={(e) =>
                      editingRoom
                        ? setEditingRoom({
                            ...editingRoom,
                            available_rooms: e.target.value,
                          })
                        : setRoomData({
                            ...roomData,
                            available_rooms: e.target.value,
                          })
                    }
                  />
                </div>
                <div className="input-field full-width">
                  <label>Description</label>
                  <textarea
                    rows="2"
                    value={
                      editingRoom ? editingRoom.room_description : roomData.desc
                    }
                    onChange={(e) =>
                      editingRoom
                        ? setEditingRoom({
                            ...editingRoom,
                            room_description: e.target.value,
                          })
                        : setRoomData({ ...roomData, desc: e.target.value })
                    }
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className={`btn-stage ${editingRoom ? "btn-warning" : ""}`}
                  onClick={
                    editingRoom
                      ? handleUpdateExistingRoom
                      : handleAddRoomTypeToExisting
                  }
                >
                  {editingRoom ? "Add Room Changes to List" : "Add to List"}
                </button>
                {editingRoom && (
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setEditingRoom(null);
                      setRoomFiles([]);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <table className="mini-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id}>
                    <td>{room.room_type}</td>
                    <td>₹{room.price_per_night}</td>
                    <td>{room.available_rooms}</td>
                    <td>
                      <div className="action-row">
                        <button
                          type="button"
                          className="edit-btn-small"
                          onClick={() => setEditingRoom(room)}
                        >
                          <Edit size={14} />
                        </button>
                        <Trash2
                          size={16}
                          className="del-icon"
                          onClick={() => handleDeleteRoom(room.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-card">
            <h4 className="section-title">
              <Utensils size={14} /> 4. Meal Menu (Staged Changes)
            </h4>
            <div className="staging-form">
              <div className="form-grid">
                <div className="input-field">
                  <label>Category</label>
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
                  <label>Dietary Type</label>
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
                    <option value="">Select Global Dish...</option>
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
                onClick={handleAddDish}
              >
                <Plus size={14} /> Add to List
              </button>
            </div>

            <table className="mini-table">
              <thead>
                <tr>
                  <th>Dish</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {hotelMeals.map((m) => (
                  <tr key={m.id}>
                    <td>{m.dish_name}</td>
                    <td style={{ textTransform: "capitalize" }}>
                      {m.meal_category}
                    </td>
                    <td>
                      <span
                        className={`badge ${m.dietary_type?.toLowerCase()}`}
                      >
                        {m.dietary_type}
                      </span>
                    </td>
                    <td>₹{m.price}</td>
                    <td>
                      <Trash2
                        size={14}
                        className="del-icon"
                        onClick={() => handleDeleteDish(m.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditHotel;
