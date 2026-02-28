import React from "react";
import "./BookingItem.scss";

const BookingItem = ({ booking, serverUrl }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatStatus = (status) => {
    if (!status) return "";
    return (
      status.charAt(0).toUpperCase() +
      status.slice(1).toLowerCase().replace(/_/g, " ")
    );
  };

  const includedMeals = Array.isArray(booking.meals) ? booking.meals : [];

  return (
    <div className="booking-card">
      <div className="hotel-info">
        <img
          src={
            booking.hotel_image
              ? `${serverUrl}${booking.hotel_image}`
              : "/default-hotel.jpg"
          }
          alt="hotel"
        />
        <div className="info-text">
          <h4>{booking.hotel_name}</h4>
          <p>
            {booking.city}, {booking.state}
          </p>
        </div>
      </div>

      <div className="stay-details">
        <div className="date-box">
          <span>Check-in</span>
          <strong>{formatDate(booking.check_in_date)}</strong>
        </div>
        <div className="date-box">
          <span>Check-out</span>
          <strong>{formatDate(booking.check_out_date)}</strong>
        </div>

        <div className="meal-info-container">
          <div className="meal-trigger">
            <span className="icon">?</span>
            <span className="label">Meals</span>
          </div>
          {includedMeals.length > 0 && (
            <div className="meal-tooltip">
              <p className="tooltip-title">Included Meals:</p>
              <ul>
                {includedMeals.map((meal, index) => {
                  const dishName = meal.dish_name || meal.name;
                  const category = meal.meal_category || meal.category;

                  return (
                    <li key={index}>
                      <span
                        className={`type-dot ${meal.dietary_type || meal.type}`}
                      ></span>
                      {dishName ? dishName : "Standard Meal"}
                      {category && (
                        <span className="category-text"> ({category})</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="price-status">
        <div className="price">
          <span>Total Paid</span>
          <strong>
            ₹{Number(booking.total_price).toLocaleString("en-IN")}
          </strong>
        </div>
        <span
          className={`status-badge ${booking.booking_status?.toLowerCase()}`}
        >
          {formatStatus(booking.booking_status)}
        </span>
      </div>
    </div>
  );
};

export default BookingItem;
