import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import { toast } from "react-toastify";
import "./AdminDashboard.scss";

const AdminDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [activeTab, setActiveTab] = useState("new");
  const [view, setView] = useState("logs");
  const [loading, setLoading] = useState(false);

  const [newHotel, setNewHotel] = useState({
    hotel_name: "",
    city: "",
    state: "",
    description: "",
    base_price: "",
    amenities: "",
    images: "",
  });

  const fetchAllHotels = async () => {
    setLoading(true);
    try {
      const res = await API.get("api/hotels/all");
      setHotels(res.data);
    } catch (err) {
      console.error("Error fetching hotels", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleHotelStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "online" ? "offline" : "online";
    try {
      await API.patch(`api/hotels/status/${id}`, { status: nextStatus });
      toast.success(`Hotel is now ${nextStatus}`);
      fetchAllHotels();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleChange = (e) => {
    setNewHotel({ ...newHotel, [e.target.name]: e.target.value });
  };

  const handleAddHotel = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newHotel,
        base_price: Number(newHotel.base_price),
        amenities: newHotel.amenities
          ? newHotel.amenities
              .split(",")
              .map((item) => item.trim())
              .filter((i) => i)
          : [],
        images: newHotel.images
          ? newHotel.images
              .split(",")
              .map((item) => item.trim())
              .filter((i) => i)
          : [],
        availability_status: "offline",
      };

      await API.post("api/hotels/add", payload);
      toast.success("Hotel added successfully!");

      setNewHotel({
        hotel_name: "",
        city: "",
        state: "",
        description: "",
        base_price: "",
        amenities: "",
        images: "",
      });

      fetchAllHotels();
    } catch (err) {
      console.error(err);
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data ||
        "Error adding hotel";
      toast.error(
        typeof serverMessage === "string"
          ? serverMessage
          : "Error adding hotel",
      );
    }
  };

  const fetchLogs = async (type) => {
    setLoading(true);
    setActiveTab(type);
    try {
      const res = await API.get(`api/bookings/admin/logs?type=${type}`);
      setLogs(res.data);
    } catch (err) {
      console.error("Error fetching logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === "logs") fetchLogs("new");
    else fetchAllHotels();
  }, [view]);

  const renderMeals = (mealsData) => {
    if (!mealsData || mealsData.length === 0)
      return <span className="text-muted">No Meals</span>;

    return mealsData.map((m, idx) => {
      if (typeof m === "string") {
        return (
          <div key={idx} className="meal-tag">
            {m}
          </div>
        );
      }
      return (
        <div key={idx} className="meal-tag">
          {m.name} <small>({m.type})</small>
        </div>
      );
    });
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Admin Control Panel</h1>
        <div className="view-switcher">
          <button
            className={view === "logs" ? "active" : ""}
            onClick={() => setView("logs")}
          >
            Booking Logs
          </button>
          <button
            className={view === "hotels" ? "active" : ""}
            onClick={() => setView("hotels")}
          >
            Manage Hotels
          </button>
        </div>
      </header>

      {view === "logs" ? (
        <>
          <div className="tab-container">
            {["new", "upcoming", "past"].map((t) => (
              <button
                key={t}
                className={activeTab === t ? "tab active" : "tab"}
                onClick={() => fetchLogs(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)} Bookings
              </button>
            ))}
          </div>

          <div className="table-wrapper">
            {loading ? (
              <div className="loader">Loading logs...</div>
            ) : (
              <table className="log-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User ID</th>
                    <th>Hotel ID</th>
                    <th>Check In/Out</th>
                    <th>Meals</th>
                    <th>GST</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Booked On</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>#{log.id}</td>
                      <td>{log.user_id}</td>
                      <td>{log.hotel_id}</td>
                      <td>
                        <div className="date-cell">
                          <div>
                            In:{" "}
                            {new Date(log.check_in_date).toLocaleDateString()}
                          </div>
                          <div>
                            Out:{" "}
                            {new Date(log.check_out_date).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="meals-cell">{renderMeals(log.meals)}</td>
                      <td>₹{log.gst_amount}</td>
                      <td>
                        <strong>₹{log.total_price}</strong>
                      </td>
                      <td>
                        <span className={`status-pill ${log.booking_status}`}>
                          {log.booking_status}
                        </span>
                      </td>
                      <td>
                        <small>
                          {new Date(log.created_at).toLocaleDateString()}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <div className="hotel-management">
          <section className="add-hotel-section">
            <h3>Add New Hotel</h3>
            <form onSubmit={handleAddHotel} className="hotel-form">
              <div className="form-group-row">
                <input
                  type="text"
                  name="hotel_name"
                  placeholder="Hotel Name"
                  required
                  value={newHotel.hotel_name}
                  onChange={handleChange}
                />
                <input
                  type="number"
                  name="base_price"
                  placeholder="Base Price (₹)"
                  required
                  value={newHotel.base_price}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group-row">
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  required
                  value={newHotel.city}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  required
                  value={newHotel.state}
                  onChange={handleChange}
                />
              </div>

              <textarea
                name="description"
                placeholder="Hotel Description"
                required
                value={newHotel.description}
                onChange={handleChange}
                rows="4"
                style={{
                  width: "100%",
                  marginTop: "10px",
                  padding: "10px",
                  minHeight: "100px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                }}
              />

              <input
                type="text"
                name="amenities"
                placeholder="Amenities (comma separated, e.g., WiFi, Pool, Gym)"
                value={newHotel.amenities}
                onChange={handleChange}
                style={{ marginTop: "10px" }}
              />

              <input
                type="text"
                name="images"
                placeholder="Image URLs (comma separated)"
                value={newHotel.images}
                onChange={handleChange}
                style={{ marginTop: "10px" }}
              />

              <button
                type="submit"
                className="add-btn"
                style={{ marginTop: "15px" }}
              >
                Add Hotel
              </button>
            </form>
          </section>

          <div className="table-wrapper">
            <h3>Existing Hotels</h3>
            <table className="log-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hotels.map((h) => (
                  <tr key={h.id}>
                    <td>{h.id}</td>
                    <td>{h.hotel_name}</td>
                    <td>
                      {h.city}, {h.state}
                    </td>
                    <td>₹{h.base_price}</td>
                    <td>
                      <span className={`status-pill ${h.availability_status}`}>
                        {h.availability_status}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`toggle-btn ${
                          h.availability_status === "online" ? "off" : "on"
                        }`}
                        onClick={() =>
                          toggleHotelStatus(h.id, h.availability_status)
                        }
                      >
                        Set{" "}
                        {h.availability_status === "online"
                          ? "Offline"
                          : "Online"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
