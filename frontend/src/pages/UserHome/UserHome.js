import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../../api/axios";
import "./UserHome.scss";

const INDIAN_LOCATIONS = {
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
  Delhi: ["New Delhi", "Dwarka", "Rohini"],
  Karnataka: ["Bangalore", "Mysore", "Mangalore", "Hampi"],
  Rajasthan: ["Jaipur", "Udaipur", "Jodhpur", "Jaisalmer"],
  Goa: ["North Goa", "South Goa", "Panjim"],
  Kerala: ["Kochi", "Munnar", "Alleppey", "Trivandrum"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Ooty"],
  "Uttar Pradesh": ["Lucknow", "Varanasi", "Agra", "Noida"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara"],
  "West Bengal": ["Kolkata", "Darjeeling", "Siliguri"],
};

const HotelCard = ({
  h,
  handleShowPrices,
  setSelectedImage,
  checkIn,
  checkOut,
}) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const serverUrl = "http://localhost:5000";

  const getDynamicPrice = () => {
    const base = parseFloat(h.base_price);
    if (checkIn && checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 1) return base + (diffDays - 1) * 200;
    }
    return base;
  };

  const nextImage = (e) => {
    e.stopPropagation();
    if (h.images && h.images.length > 0) {
      setCurrentImgIndex((prev) => (prev + 1) % h.images.length);
    }
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (h.images && h.images.length > 0) {
      setCurrentImgIndex(
        (prev) => (prev - 1 + h.images.length) % h.images.length,
      );
    }
  };

  const getImageUrl = (index) => {
    return h.images && h.images[index]
      ? `${serverUrl}${h.images[index]}`
      : "/default-hotel.jpg";
  };

  return (
    <div className="hotel-card-horizontal">
      <div className="image-section">
        <img
          src={getImageUrl(currentImgIndex)}
          alt={h.hotel_name}
          className="clickable-img"
          onClick={() => setSelectedImage(getImageUrl(currentImgIndex))}
        />
        {h.images && h.images.length > 1 && (
          <div className="gallery-controls">
            <button className="gallery-btn prev" onClick={prevImage}>
              ‹
            </button>
            <button className="gallery-btn next" onClick={nextImage}>
              ›
            </button>
            <div className="image-counter">
              {currentImgIndex + 1} / {h.images.length}
            </div>
          </div>
        )}
      </div>

      <div className="content-section">
        <div className="header-row">
          <div className="title-group">
            <h3>{h.hotel_name}</h3>
            <div className="stars">{"⭐".repeat(Math.floor(h.rating))}</div>
          </div>
          <div className="rating-badge">
            <div className="rating-text">
              <span className="status">Very Good</span>
              <span className="review-count">285 reviews</span>
            </div>
            <span className="score">{h.rating}</span>
          </div>
        </div>

        <p className="location-text">
          {h.city}, {h.state}
        </p>
        <p className="description">
          {h.description || "Located in the heart of the city..."}
        </p>

        <div className="amenities-row">
          {h.amenities?.slice(0, 3).map((item) => (
            <span key={item} className="amenity-tag">
              ✔ {item}
            </span>
          ))}
        </div>
      </div>

      <div className="price-section">
        <div className="price-box">
          <span className="price-label">Price starting at</span>
          <span className="amount">₹{getDynamicPrice()}</span>
          <small>+ taxes & fees</small>
        </div>
        <button className="action-btn" onClick={() => handleShowPrices(h)}>
          Book
        </button>
      </div>
    </div>
  );
};

const UserHome = () => {
  const [hotels, setHotels] = useState([]);

  const [query, setQuery] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [availableCities, setAvailableCities] = useState([]);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const fetchInitialHotels = async () => {
    setLoading(true);
    try {
      const res = await API.get("api/hotels/online");
      setHotels(res.data);
    } catch (err) {
      console.error("Error fetching initial hotels", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setQuery("");
    setSelectedState("");
    setSelectedCity("");
    setCheckIn("");
    setCheckOut("");
    setAvailableCities([]);

    fetchInitialHotels();
  }, [location.key]);

  const handleStateChange = (e) => {
    const state = e.target.value;
    setSelectedState(state);
    setSelectedCity("");
    if (state && INDIAN_LOCATIONS[state]) {
      setAvailableCities(INDIAN_LOCATIONS[state]);
    } else {
      setAvailableCities([]);
    }
  };

  const handleSearch = async () => {
    if ((!checkIn && checkOut) || (checkIn && !checkOut)) {
      return alert("Please select both check-in and check-out dates");
    }

    if (checkIn && checkOut && new Date(checkIn) >= new Date(checkOut)) {
      return alert("Check-out date must be after check-in date");
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append("query", query);
      if (selectedState) params.append("state", selectedState);
      if (selectedCity) params.append("city", selectedCity);

      const res = await API.get(`api/hotels/search?${params.toString()}`);
      setHotels(res.data);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowPrices = (hotel) => {
    if (!checkIn || !checkOut) {
      return alert("Please select your travel dates first");
    }

    const token = localStorage.getItem("accessToken");

    const navigationState = {
      state: {
        hotel,
        checkInDate: checkIn,
        checkOutDate: checkOut,
      },
    };

    if (token) {
      navigate("/checkout", navigationState);
    } else {
      localStorage.setItem(
        "pendingBooking",
        JSON.stringify({
          hotel,
          checkInDate: checkIn,
          checkOutDate: checkOut,
        }),
      );
      navigate(`/login?redirect=checkout`);
    }
  };

  return (
    <div className="user-home-container">
      {selectedImage && (
        <div
          className="image-modal-overlay"
          onClick={() => setSelectedImage(null)}
        >
          <div className="modal-content">
            <span className="close-modal">&times;</span>
            <img src={selectedImage} alt="Hotel Preview" />
          </div>
        </div>
      )}

      <div className="search-banner">
        <div className="search-bar">
          <div className="input-wrapper" style={{ flex: 1 }}>
            <i className="fas fa-map-marker-alt"></i>
            <select
              value={selectedState}
              onChange={handleStateChange}
              style={{
                border: "none",
                outline: "none",
                width: "100%",
                background: "transparent",
              }}
            >
              <option value="">All States</option>
              {Object.keys(INDIAN_LOCATIONS).map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div className="input-wrapper" style={{ flex: 1 }}>
            <i className="fas fa-city"></i>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              disabled={!selectedState}
              style={{
                border: "none",
                outline: "none",
                width: "100%",
                background: "transparent",
              }}
            >
              <option value="">
                {selectedState ? "All Cities" : "Select State First"}
              </option>
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="input-wrapper destination" style={{ flex: 1.5 }}>
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Hotel Name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="input-wrapper dates">
            <div className="date-field">
              <span className="date-label">Check-in</span>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
          </div>

          <div className="input-wrapper dates">
            <div className="date-field">
              <span className="date-label">Check-out</span>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
          </div>

          <button className="search-btn" onClick={handleSearch}>
            Search
          </button>
        </div>
      </div>

      <div className="results-container">
        {loading ? (
          <div className="loader">Searching for best hotels...</div>
        ) : (
          <div className="hotel-list">
            {hotels.length > 0 ? (
              hotels.map((h) => (
                <HotelCard
                  key={h.id}
                  h={h}
                  handleShowPrices={handleShowPrices}
                  setSelectedImage={setSelectedImage}
                  checkIn={checkIn}
                  checkOut={checkOut}
                />
              ))
            ) : (
              <div className="empty-state">
                <p>No hotels found. Try a different search.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserHome;
