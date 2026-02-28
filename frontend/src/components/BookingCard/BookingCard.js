import React from "react";
import { FaPen, FaChevronDown } from "react-icons/fa";
import MealTags from "../MealTags/MealTags";
import "./BookingCard.scss";

const BookingCard = ({
  booking,
  isHistory,
  onStatusChange,
  onForceEditRequest,
  updatingId,
  editableId,
}) => {
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

  const isLocked =
    booking.booking_status === "checked_out" && editableId !== booking.id;

  return (
    <div
      className="booking-card animate-in"
      style={{
        borderLeft: `5px solid ${getStatusColor(booking.booking_status)}`,
        opacity: isLocked ? 0.8 : 1,
      }}
    >
      <div className="card-main-layout">
        <div className="card-left-info">
          <div className="id-stack">
            {isHistory && (
              <button
                className="edit-icon-btn"
                onClick={() => onForceEditRequest(booking.id)}
              >
                <FaPen size={14} />
              </button>
            )}
            <span className="booking-number">Booking #{booking.id}</span>
          </div>
          <span className="total-price">₹{booking.total_price}</span>
        </div>
        <div className="card-right-details">
          <div
            className={`status-select-container ${isLocked ? "locked" : ""}`}
          >
            <label className="status-label">CURRENT STATUS</label>
            <div className="select-wrapper">
              <span className="current-display">
                {booking.booking_status === "checked_out"
                  ? "🏁 Checked Out"
                  : booking.booking_status === "checked_in"
                    ? "✅ Checked In"
                    : "⏳ Pending"}
              </span>
              <FaChevronDown className="dropdown-arrow" size={12} />

              <select
                value={
                  booking.booking_status === "confirmed"
                    ? "pending"
                    : booking.booking_status
                }
                onChange={(e) => onStatusChange(booking.id, e.target.value)}
                disabled={updatingId === booking.id || isLocked}
                className="hidden-select"
              >
                <option value="pending">⏳ Pending</option>
                <option value="checked_in">✅ Checked In</option>
                <option value="checked_out">🏁 Checked Out</option>
              </select>
            </div>
          </div>

          <div className="info-grid">
            <div className="info-row">
              <strong>Check-in:</strong>
              <span>
                {new Date(booking.check_in_date).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>
            <div className="info-row">
              <strong>Check-out:</strong>
              <span>
                {new Date(booking.check_out_date).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>
          </div>

          <div className="meals-divider">
            <label className="section-label">MEALS:</label>
            <MealTags meals={booking.meals} />
          </div>

          <p className="booked-on-text">
            Booked on:{" "}
            {new Date(booking.created_at).toLocaleString([], {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
