import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { toast } from "react-toastify";
import {
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaFacebook,
  FaTwitter,
  FaInstagram,
} from "react-icons/fa";
import Homepage from "./Homepage/Homepage";
import "./UserHome.scss";

const UserHome = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const serverUrl = process.env.REACT_APP_API_URL;

  const [hotels, setHotels] = useState([]);
  const [locationData, setLocationData] = useState({});
  const [siteData, setSiteData] = useState(null);
  const [query, setQuery] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [availableCities, setAvailableCities] = useState([]);

  const [checkIn, setCheckIn] = useState(location.state?.checkInDate || "");
  const [checkOut, setCheckOut] = useState(location.state?.checkOutDate || "");

  const [loading, setLoading] = useState(false);
  const [modalData, setModalData] = useState({
    images: [],
    index: 0,
    isOpen: false,
  });

  const isExactHome = location.pathname === "/";
  const isHotelDetailPage = location.pathname.includes("/hotel/");
  const isManagementPage =
    location.pathname.includes("/logs") ||
    location.pathname.includes("/hotels") ||
    location.pathname.includes("/staff");

  const today = new Date();
  const minCheckIn = today.toISOString().split("T")[0];
  const maxLimitDate = new Date();
  maxLimitDate.setDate(today.getDate() + 15);
  const maxCheckInLimit = maxLimitDate.toISOString().split("T")[0];

  const getMinCheckOut = () => {
    if (!checkIn) return minCheckIn;
    const nextDay = new Date(checkIn);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay.toISOString().split("T")[0];
  };

  const getMaxCheckOut = () => {
    const maxOut = new Date(maxLimitDate);
    maxOut.setDate(maxOut.getDate() + 1);
    return maxOut.toISOString().split("T")[0];
  };

  const handleCheckInChange = (e) => {
    const newIn = e.target.value;
    setCheckIn(newIn);
    if (checkOut && new Date(newIn) >= new Date(checkOut)) {
      const nextDay = new Date(newIn);
      nextDay.setDate(nextDay.getDate() + 1);
      setCheckOut(nextDay.toISOString().split("T")[0]);
    }
  };

  const handleCheckOutChange = (e) => {
    const newOut = e.target.value;
    if (checkIn && new Date(newOut) <= new Date(checkIn)) {
      toast.error("Check-Out must be after Check-In");
      const nextDay = new Date(checkIn);
      nextDay.setDate(nextDay.getDate() + 1);
      setCheckOut(nextDay.toISOString().split("T")[0]);
    } else {
      setCheckOut(newOut);
    }
  };

  useEffect(() => {
    const fetchSiteInfo = async () => {
      try {
        const res = await API.get("/api/globaldetails/details");
        setSiteData(res.data);
      } catch (err) {
        console.error("Error loading site details", err);
      }
    };
    fetchSiteInfo();
    fetchLocations();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.toString()) {
      performSearch(params);
    } else {
      fetchInitialHotels();
    }
  }, [location.search]);

  const fetchLocations = async () => {
    try {
      const res = await API.get("api/hotels/locations");
      setLocationData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInitialHotels = async () => {
    setLoading(true);
    try {
      const res = await API.get("api/hotels/online");
      setHotels(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (params) => {
    setLoading(true);
    try {
      const res = await API.get(`api/hotels/search?${params.toString()}`);
      setHotels(res.data);
      setQuery(params.get("query") || "");
      setSelectedState(params.get("state") || "");
      setSelectedCity(params.get("city") || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStateChange = (e) => {
    const state = e.target.value;
    setSelectedState(state);
    setSelectedCity("");
    if (state && locationData.stateCityMap?.[state]) {
      setAvailableCities(locationData.stateCityMap[state]);
    } else {
      setAvailableCities([]);
    }
  };

  const handleSearchNavigation = () => {
    if (!checkIn || !checkOut) {
      return toast.warn("Please select both dates");
    }
    const params = new URLSearchParams();
    if (query) params.append("query", query);
    if (selectedState) params.append("state", selectedState);
    if (selectedCity) params.append("city", selectedCity);
    if (checkIn) params.append("checkIn", checkIn);
    if (checkOut) params.append("checkOut", checkOut);

    navigate({
      pathname: "/search",
      search: `?${params.toString()}`,
    });
  };

  const openModal = (images, index) =>
    setModalData({ images, index, isOpen: true });
  const nextModalImage = (e) => {
    e.stopPropagation();
    setModalData((prev) => ({
      ...prev,
      index: (prev.index + 1) % prev.images.length,
    }));
  };
  const prevModalImage = (e) => {
    e.stopPropagation();
    setModalData((prev) => ({
      ...prev,
      index: (prev.index - 1 + prev.images.length) % prev.images.length,
    }));
  };

  return (
    <div className="user-home-container">
      {!isManagementPage && (
        <div className="search-banner">
          <div className="search-bar">
            <div className="input-wrapper">
              <label className="date-label">State</label>
              <select value={selectedState} onChange={handleStateChange}>
                <option value="">All States</option>
                {locationData.states?.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-wrapper">
              <label className="date-label">City</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                disabled={!selectedState}
              >
                <option value="">
                  {selectedState ? "All Cities" : "Select State"}
                </option>
                {availableCities.map((c) => (
                  <option key={c.id} value={c.city_name}>
                    {c.city_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-wrapper">
              <label className="date-label">Hotel Name</label>
              <input
                type="text"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="input-wrapper">
              <label className="date-label">Check-In</label>
              <input
                type="date"
                value={checkIn}
                min={minCheckIn}
                max={maxCheckInLimit}
                onChange={handleCheckInChange}
              />
            </div>
            <div className="input-wrapper">
              <label className="date-label">Check-Out</label>
              <input
                type="date"
                value={checkOut}
                min={getMinCheckOut()}
                max={getMaxCheckOut()}
                onChange={handleCheckOutChange}
              />
            </div>
            <button className="search-btn" onClick={handleSearchNavigation}>
              BOOK NOW
            </button>
          </div>
        </div>
      )}

      <main className="main-view-port">
        {isExactHome ? (
          <Homepage />
        ) : (
          <div
            className={`results-container ${isHotelDetailPage ? "detail-view" : ""}`}
          >
            <Outlet
              context={{
                openModal,
                serverUrl,
                hotels,
                loading,
                checkIn,
                checkOut,
              }}
            />
          </div>
        )}
      </main>

      <footer className="global-footer">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-col">
              <h4>SOCIAL MEDIA</h4>
              <div className="social-links">
                {siteData?.facebook_url && (
                  <a
                    href={siteData.facebook_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FaFacebook />
                  </a>
                )}
                {siteData?.twitter_url && (
                  <a
                    href={
                      siteData.twitter_url.startsWith("http")
                        ? siteData.twitter_url
                        : `https://${siteData.twitter_url}`
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FaTwitter />
                  </a>
                )}
                {siteData?.instagram_url && (
                  <a
                    href={siteData.instagram_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FaInstagram />
                  </a>
                )}
              </div>
            </div>

            <div className="footer-col">
              <h4>COMPANY</h4>
              <nav className="footer-nav">
                <a href={`mailto:${siteData?.contact_email}`}>
                  Contact: {siteData?.contact_email}
                </a>
                <a href={`tel:${siteData?.contact_phone}`}>
                  Phone: {siteData?.contact_phone}
                </a>
              </nav>
            </div>

            <div className="footer-col pricing-guarantee">
              <div className="guarantee-box">
                <strong>BEST PRICE GUARANTEE</strong>
                <p>
                  Book online or call{" "}
                  <a href={`tel:${siteData?.contact_phone}`}>
                    {siteData?.contact_phone}
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© 2026 {siteData?.hotel_name}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {modalData.isOpen && (
        <div
          className="image-modal-overlay"
          onClick={() => setModalData({ ...modalData, isOpen: false })}
        >
          <button className="close-modal-btn">
            <FaTimes />
          </button>
          <div className="modal-wrapper" onClick={(e) => e.stopPropagation()}>
            {modalData.images.length > 1 && (
              <button className="modal-nav-btn prev" onClick={prevModalImage}>
                <FaChevronLeft />
              </button>
            )}
            <div className="modal-image-container">
              <img
                src={`${serverUrl}${modalData.images[modalData.index]}`}
                alt="Zoom"
              />
            </div>
            {modalData.images.length > 1 && (
              <button className="modal-nav-btn next" onClick={nextModalImage}>
                <FaChevronRight />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserHome;
