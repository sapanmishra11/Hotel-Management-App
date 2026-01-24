import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import "./Checkout.scss";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [bookingDetails, setBookingDetails] = useState(() => {
    const saved = localStorage.getItem("pendingBooking");
    const parsed = saved ? JSON.parse(saved) : null;

    return {
      hotel: location.state?.hotel || parsed?.hotel,
      checkInDate: location.state?.checkInDate || parsed?.checkInDate,
      checkOutDate: location.state?.checkOutDate || parsed?.checkOutDate,
    };
  });

  const { hotel, checkInDate, checkOutDate } = bookingDetails;

  const [meals, setMeals] = useState({
    breakfast: false,
    lunch: false,
    dinner: false,
  });

  const [mealTypes, setMealTypes] = useState({
    breakfast: "Veg",
    lunch: "Veg",
    dinner: "Veg",
  });

  const MEAL_PRICES = {
    breakfast: 500,
    lunch: 800,
    dinner: 1000,
  };

  useEffect(() => {
    if (!hotel || !checkInDate || !checkOutDate) {
      navigate("/home");
    } else {
      localStorage.removeItem("pendingBooking");
    }
  }, [hotel, checkInDate, checkOutDate, navigate]);

  if (!hotel) return null;

  const calculateBasePrice = () => {
    const originalPrice = parseFloat(hotel.base_price) || 0;

    if (checkInDate && checkOutDate) {
      const start = new Date(checkInDate);
      const end = new Date(checkOutDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 1) {
        return originalPrice + (diffDays - 1) * 200;
      }
    }
    return originalPrice;
  };

  const basePrice = calculateBasePrice();

  const mealPrice = Object.keys(meals).reduce((acc, meal) => {
    return meals[meal] ? acc + MEAL_PRICES[meal] : acc;
  }, 0);

  const gst = (basePrice + mealPrice) * 0.05;
  const total = basePrice + mealPrice + gst;

  const handleMealChange = (mealName) => {
    setMeals((prev) => ({
      ...prev,
      [mealName]: !prev[mealName],
    }));
  };

  const handleTypeChange = (mealName, type) => {
    setMealTypes((prev) => ({
      ...prev,
      [mealName]: type,
    }));
  };

  const handleConfirmBooking = async () => {
    try {
      const userId = localStorage.getItem("user_id");
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken || !userId) {
        alert("Session expired. Please login again.");
        localStorage.setItem(
          "pendingBooking",
          JSON.stringify({ hotel, checkInDate, checkOutDate }),
        );
        window.location.href = "/login?redirect=checkout";
        return;
      }

      const selectedMealsArray = Object.keys(meals)
        .filter((key) => meals[key])
        .map((key) => ({
          name: key,
          type: mealTypes[key],
        }));

      const bookingData = {
        user_id: parseInt(userId),
        hotel_id: parseInt(hotel.id),
        total_price: total.toFixed(2),
        gst_amount: gst.toFixed(2),
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        meals: selectedMealsArray,
      };

      const res = await API.post("api/bookings/new", bookingData);

      if (res.status === 201 || res.status === 200) {
        alert("Booking Successful! A confirmation email has been sent to you.");
        navigate("/home");
      }
    } catch (err) {
      console.error(err);
      alert(`Booking failed: ${err.response?.data?.error || "Server Error"}`);
    }
  };

  return (
    <div className="checkout-container">
      <h2>Complete your booking</h2>
      <div className="checkout-grid">
        <div className="selection-section">
          <div className="card">
            <h3>Selected Hotel</h3>
            <p>
              <strong>{hotel.hotel_name}</strong>
            </p>
            <p>
              {hotel.city}, {hotel.state}
            </p>
            <hr />
            <p>
              <i className="fas fa-calendar-alt"></i>{" "}
              <strong>Stay Dates:</strong>
            </p>
            <p>
              {checkInDate} to {checkOutDate}
            </p>
          </div>

          <div className="card meal-plan-options">
            <h3>Select Meals</h3>
            {["breakfast", "lunch", "dinner"].map((meal) => (
              <div
                key={meal}
                className="meal-group"
                style={{
                  marginBottom: "15px",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "10px",
                }}
              >
                <label
                  className="meal-item"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={meals[meal]}
                    onChange={() => handleMealChange(meal)}
                    style={{
                      width: "20px",
                      height: "20px",
                      marginRight: "10px",
                    }}
                  />
                  <div className="meal-info" style={{ flex: 1 }}>
                    <span
                      style={{
                        textTransform: "capitalize",
                        fontWeight: "bold",
                      }}
                    >
                      {meal}
                    </span>
                    <span style={{ marginLeft: "10px", color: "#666" }}>
                      + ₹{MEAL_PRICES[meal]}
                    </span>
                  </div>
                </label>
                {meals[meal] && (
                  <div
                    className="meal-type-selector"
                    style={{
                      marginLeft: "35px",
                      marginTop: "5px",
                      display: "flex",
                      gap: "15px",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                      }}
                    >
                      <input
                        type="radio"
                        name={`${meal}-type`}
                        value="Veg"
                        checked={mealTypes[meal] === "Veg"}
                        onChange={() => handleTypeChange(meal, "Veg")}
                        style={{ marginRight: "5px" }}
                      />
                      Veg 🥬
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                      }}
                    >
                      <input
                        type="radio"
                        name={`${meal}-type`}
                        value="Non-Veg"
                        checked={mealTypes[meal] === "Non-Veg"}
                        onChange={() => handleTypeChange(meal, "Non-Veg")}
                        style={{ marginRight: "5px" }}
                      />
                      Non-Veg 🍗
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="card payment-methods">
            <h3>Payment Method</h3>
            <div className="payment-item">
              <i className="fas fa-money-bill-wave"></i>
              <span>Pay at Hotel</span>
            </div>
          </div>
        </div>

        <div className="summary-sidebar">
          <h3>Price Summary</h3>
          <div className="price-row">
            <span>Room Price</span>
            <span>₹{basePrice.toLocaleString()}</span>
          </div>
          <div className="price-row">
            <span>Add-on Meals</span>
            <span>₹{mealPrice.toLocaleString()}</span>
          </div>
          <div className="price-row">
            <span>GST (5%)</span>
            <span>₹{gst.toFixed(2)}</span>
          </div>
          <div className="price-row total">
            <span>Total Amount</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          <button className="book-now-btn" onClick={handleConfirmBooking}>
            Confirm Booking
          </button>
          <small className="guarantee-text">✔ No payment needed now</small>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
