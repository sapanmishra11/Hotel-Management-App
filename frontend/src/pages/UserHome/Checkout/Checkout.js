import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../../../api/axios";
import { toast } from "react-toastify";
import "./Checkout.scss";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hotelMenu, setHotelMenu] = useState([]);
  const [selectedDishIds, setSelectedDishIds] = useState([]);

  const [activeModal, setActiveModal] = useState(null);

  const [bookingDetails, setBookingDetails] = useState(() => {
    const saved = localStorage.getItem("pendingBooking");
    const parsed = saved ? JSON.parse(saved) : null;
    return {
      hotel: location.state?.hotel || parsed?.hotel,
      roomType: location.state?.roomType || parsed?.roomType,
      checkInDate: location.state?.checkInDate || parsed?.checkInDate,
      checkOutDate: location.state?.checkOutDate || parsed?.checkOutDate,
      totalNights: location.state?.totalNights || parsed?.totalNights,
      totalPrice: location.state?.totalPrice || parsed?.totalPrice,
    };
  });

  const {
    hotel,
    roomType,
    checkInDate,
    checkOutDate,
    totalNights,
    totalPrice,
  } = bookingDetails;

  const [mealTypes, setMealTypes] = useState({
    breakfast: "Veg",
    lunch: "Veg",
    dinner: "Veg",
  });

  useEffect(() => {
    if (hotel?.id) {
      const fetchMenu = async () => {
        try {
          const res = await API.get(`api/hotels/meals/${hotel.id}`);
          setHotelMenu(res.data);
        } catch (err) {
          console.error("Failed to load menu", err);
        }
      };
      fetchMenu();
    }
  }, [hotel]);

  if (!hotel) return null;

  const handleDishToggle = (dishId) => {
    setSelectedDishIds((prev) =>
      prev.includes(dishId)
        ? prev.filter((id) => id !== dishId)
        : [...prev, dishId],
    );
  };

  const nightsCount = totalNights || 1;
  const baseRoomPrice = totalPrice || 0;

  const mealTotal = selectedDishIds.reduce((acc, id) => {
    const dish = hotelMenu.find((m) => m.id === id);
    return acc + parseFloat(dish?.price || 0) * nightsCount;
  }, 0);

  const gst = (baseRoomPrice + mealTotal) * 0.05;
  const finalTotal = baseRoomPrice + mealTotal + gst;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleConfirmBooking = async () => {
    const userId = localStorage.getItem("userId");
    const selectedMealsArray = hotelMenu
      .filter((m) => selectedDishIds.includes(m.id))
      .map((m) => ({
        dish_name: m.dish_name,
        meal_category: m.meal_category,
        dietary_type: m.dietary_type,
        price: m.price,
      }));

    const bookingData = {
      user_id: parseInt(userId),
      hotel_id: parseInt(hotel.id),
      hotel_name: hotel.hotel_name,
      room_type: roomType,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      gst_amount: parseFloat(gst.toFixed(2)),
      total_price: parseFloat(finalTotal.toFixed(2)),
      original_total_price: parseFloat((baseRoomPrice + mealTotal).toFixed(2)),
      meals: selectedMealsArray,
    };

    setIsSubmitting(true);
    try {
      await API.post("api/bookings/new", bookingData);
      toast.success("Booking Successful!");
      localStorage.removeItem("pendingBooking");
      navigate(`/user/${userId}/dashboard`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Booking failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-container">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <span>←</span> Back to Hotel
      </button>
      <h2>Review Your Stay</h2>
      <div className="checkout-grid">
        <div className="selection-section">
          <div className="card">
            <h3>Hotel & Room</h3>
            <p>
              <strong>{hotel.hotel_name}</strong>
            </p>
            <p className="room-badge">{roomType}</p>
          </div>

          <div className="card meal-plan-options">
            <h3>Add Meals</h3>
            <div className="meal-button-grid">
              {["breakfast", "lunch", "dinner"].map((cat) => {
                const count = hotelMenu.filter(
                  (m) =>
                    m.meal_category === cat && selectedDishIds.includes(m.id),
                ).length;

                return (
                  <button
                    key={cat}
                    className={`meal-popup-trigger ${count > 0 ? "selected" : ""}`}
                    onClick={() => setActiveModal(cat)}
                  >
                    <span className="cat-name">{cat}</span>
                    <span className="cat-status">
                      {count > 0 ? `${count} items selected` : "Select Items"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="summary-sidebar">
          <h3>Summary</h3>
          <div className="summary-details">
            <div className="price-row">
              <span>Dates</span>
              <span style={{ fontSize: "0.85rem", textAlign: "right" }}>
                {formatDate(checkInDate)} - {formatDate(checkOutDate)}
              </span>
            </div>
            <div className="price-row">
              <span>Nights Stay</span>
              <span>{nightsCount} Nights</span>
            </div>
            <div className="price-row">
              <span>Room</span>
              <span>₹{baseRoomPrice}</span>
            </div>
            <div className="price-row">
              <span>Meals</span>
              <span>₹{mealTotal}</span>
            </div>
            <div className="price-row gst">
              <span>GST (5%)</span>
              <span>₹{gst.toFixed(2)}</span>
            </div>
            <div className="price-row total">
              <span>Total</span>
              <span>₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>
          <button
            className="book-now-btn"
            onClick={handleConfirmBooking}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Confirm Booking"}
          </button>
        </div>
      </div>

      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4 style={{ textTransform: "capitalize" }}>
                {activeModal} Menu
              </h4>
              <div className="meal-type-toggle">
                <label>
                  <input
                    type="radio"
                    name="modal-type"
                    checked={mealTypes[activeModal] === "Veg"}
                    onChange={() =>
                      setMealTypes({ ...mealTypes, [activeModal]: "Veg" })
                    }
                  />{" "}
                  Veg
                </label>
                <label>
                  <input
                    type="radio"
                    name="modal-type"
                    checked={mealTypes[activeModal] === "Non-Veg"}
                    onChange={() =>
                      setMealTypes({ ...mealTypes, [activeModal]: "Non-Veg" })
                    }
                  />{" "}
                  Non-Veg
                </label>
              </div>
            </div>
            <div className="dish-list">
              {hotelMenu
                .filter(
                  (m) =>
                    m.meal_category === activeModal &&
                    m.dietary_type === mealTypes[activeModal],
                )
                .map((dish) => (
                  <div key={dish.id} className="dish-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedDishIds.includes(dish.id)}
                        onChange={() => handleDishToggle(dish.id)}
                      />
                      <span>{dish.dish_name}</span>
                    </label>
                    <span className="price">
                      ₹{parseFloat(dish.price).toFixed(0)}
                    </span>
                  </div>
                ))}
            </div>
            <button
              className="close-modal-btn"
              onClick={() => setActiveModal(null)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
