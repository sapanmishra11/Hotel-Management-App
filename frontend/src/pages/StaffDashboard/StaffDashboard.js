import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import API from "../../api/axios";
import "./StaffDashboard.scss";

const socket = io("http://localhost:5000");

const StaffDashboard = () => {
  const [liveBookings, setLiveBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const hotelId = localStorage.getItem("hotel_id") || 3;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await API.get(`/api/bookings/hotel/${hotelId}`);
        setLiveBookings(res.data);
      } catch (err) {
        console.error("API Error:", err.response?.data || err.message);
        toast.error("Failed to load booking history.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();

    socket.emit("join_hotel_room", hotelId);
    socket.on("new_booking_alert", (data) => {
      toast.success(`🛎️ ${data.message}`);
      setLiveBookings((prev) => [data.details, ...prev]);
    });

    return () => socket.off("new_booking_alert");
  }, [hotelId]);

  const handleStatusChange = async (bookingId, newStatus) => {
    setUpdatingId(bookingId);
    try {
      await API.patch(`/api/bookings/status/${bookingId}`, {
        status: newStatus,
      });

      setLiveBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, booking_status: newStatus } : b,
        ),
      );

      const emoji =
        newStatus === "checked_in"
          ? "✅"
          : newStatus === "checked_out"
            ? "👋"
            : "⏳";
      toast.success(
        `${emoji} Status updated to ${newStatus.replace("_", " ")}`,
      );
    } catch (err) {
      toast.error("Failed to update status");
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const renderMeals = (meals) => {
    if (!meals || meals.length === 0) {
      return (
        <span
          className="text-muted"
          style={{ color: "#94a3b8", fontStyle: "italic" }}
        >
          Room Only
        </span>
      );
    }
    return (
      <div
        className="meal-tags-container"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "5px",
          marginTop: "5px",
        }}
      >
        {meals.map((m, index) => {
          const label = typeof m === "string" ? m : `${m.name} (${m.type})`;
          return (
            <span
              key={index}
              className="meal-pill"
              style={{
                background: "#eff6ff",
                color: "#1e40af",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "0.8rem",
                border: "1px solid #dbeafe",
                fontWeight: "500",
              }}
            >
              {label}
            </span>
          );
        })}
      </div>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "checked_in":
        return "#22c55e";
      case "checked_out":
        return "#94a3b8";
      case "pending":
        return "#f59e0b";
      default:
        return "#f59e0b";
    }
  };

  return (
    <div className="staff-dashboard">
      <nav className="staff-nav">
        <h2>Staff Portal - Hotel #{hotelId}</h2>
        <span className="live-indicator">● Live Updates Active</span>
      </nav>

      <div className="alert-area">
        <h3>Booking Logs</h3>
        <div className="booking-cards">
          {isLoading ? (
            <div className="empty-state">Loading history...</div>
          ) : liveBookings.length > 0 ? (
            liveBookings.map((booking, index) => (
              <div
                key={booking.id || index}
                className="booking-card animate-in"
                style={{
                  borderLeft: `5px solid ${getStatusColor(booking.booking_status)}`,
                  opacity: booking.booking_status === "checked_out" ? 0.6 : 1,
                }}
              >
                <div className="card-header">
                  <span className="id">Booking #{booking.id}</span>
                  <span className="price">₹{booking.total_price}</span>
                </div>

                <div className="card-body">
                  {/* --- Updated Dropdown with only 3 Options --- */}
                  <div
                    className="status-selector"
                    style={{
                      marginBottom: "15px",
                      background: "#f8fafc",
                      padding: "8px",
                      borderRadius: "6px",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        color: "#64748b",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Current Status
                    </label>
                    <select
                      value={
                        booking.booking_status === "confirmed"
                          ? "pending"
                          : booking.booking_status
                      }
                      onChange={(e) =>
                        handleStatusChange(booking.id, e.target.value)
                      }
                      disabled={updatingId === booking.id}
                      style={{
                        width: "100%",
                        padding: "6px",
                        borderRadius: "4px",
                        border: "1px solid #cbd5e1",
                        fontWeight: "600",
                        color: "#334155",
                      }}
                    >
                      <option value="pending">⏳ Pending</option>
                      <option value="checked_in">✅ Checked In</option>
                      <option value="checked_out">🏁 Checked Out</option>
                    </select>
                  </div>

                  <p>
                    <strong>Check-in:</strong>{" "}
                    {new Date(booking.check_in_date).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Check-out:</strong>{" "}
                    {new Date(booking.check_out_date).toLocaleDateString()}
                  </p>

                  <div className="meals-section" style={{ margin: "10px 0" }}>
                    <strong>Meals:</strong>
                    {renderMeals(booking.meals)}
                  </div>

                  <p>
                    <strong>GST Paid:</strong> ₹{booking.gst_amount}
                  </p>
                  <p className="timestamp">
                    Booked on: {new Date(booking.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              No bookings found for this hotel yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
