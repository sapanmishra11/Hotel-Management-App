import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Hotel,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import API from "../../../../api/axios";
import { toast } from "react-toastify";
import "./AddStaff.scss";

const AddStaff = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [hotelSearch, setHotelSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [staffData, setStaffData] = useState({
    username: "",
    email: "",
    password: "",
    phoneNumber: "",
    assigned_hotel_id: "",
    assigned_hotel_name: "",
  });

  useEffect(() => {
    fetchAllHotels();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchAllHotels = async () => {
    try {
      const res = await API.get("api/hotels/all");
      setHotels(res.data);
    } catch (err) {
      console.error("Fetch Hotels Error:", err);
      toast.error("Failed to load hotels for assignment");
    }
  };

  const validateForm = () => {
    const { username, email, phoneNumber, assigned_hotel_id, password } =
      staffData;

    if (!username || username.trim().length < 3) {
      toast.error("Full Name must be at least 3 characters long");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast.error("Phone number must be exactly 10 numeric digits");
      return false;
    }
    if (!assigned_hotel_id) {
      toast.error("Please select and assign a hotel");
      return false;
    }
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return false;
    }
    return true;
  };

  const handleRegisterStaff = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsProcessing(true);
    try {
      await API.post("api/auth/add-staff", staffData);
      toast.success("Staff registered successfully!");
      navigate(-1);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data ||
        "Error adding staff";
      toast.error(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const displayHotels = hotelSearch
    ? hotels.filter(
        (h) =>
          h.hotel_name.toLowerCase().includes(hotelSearch.toLowerCase()) ||
          h.city.toLowerCase().includes(hotelSearch.toLowerCase()),
      )
    : showDropdown
      ? hotels
      : [];

  return (
    <div className="admin-container">
      <div className="form-header-toolbar">
        <button onClick={() => navigate(-1)} className="back-link">
          <ArrowLeft size={16} /> Back to Staff Directory
        </button>
      </div>

      <div className="table-wrapper boxed-layout">
        <div className="table-header">
          <div className="title-section">
            <h2>Add Staff Member</h2>
            <p>Create a new account and assign a property for staff access</p>
          </div>
          <div className="header-actions">
            <button
              className="add-btn"
              onClick={handleRegisterStaff}
              disabled={isProcessing}
            >
              <Save size={16} />{" "}
              {isProcessing ? "Registering..." : "Register Staff"}
            </button>
          </div>
        </div>

        <div className="form-sections">
          <div className="form-card">
            <h4 className="section-title">
              <UserIcon size={14} /> 1. Profile Information
            </h4>
            <div className="form-grid">
              <div className="input-field">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter legal name"
                  required
                  value={staffData.username}
                  onChange={(e) =>
                    setStaffData({ ...staffData, username: e.target.value })
                  }
                />
              </div>
              <div className="input-field">
                <label>Email Address *</label>
                <input
                  type="email"
                  placeholder="name@hotel.com"
                  required
                  value={staffData.email}
                  onChange={(e) =>
                    setStaffData({ ...staffData, email: e.target.value })
                  }
                />
              </div>
              <div className="input-field">
                <label>Mobile Number *</label>
                <input
                  type="text"
                  placeholder="10 digit number"
                  maxLength={10}
                  required
                  value={staffData.phoneNumber}
                  onChange={(e) =>
                    setStaffData({
                      ...staffData,
                      phoneNumber: e.target.value.replace(/\D/g, ""),
                    })
                  }
                />
              </div>
              <div className="input-field">
                <label>Temporary Password *</label>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  required
                  value={staffData.password}
                  onChange={(e) =>
                    setStaffData({ ...staffData, password: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <div className="form-card">
            <h4 className="section-title">
              <Hotel size={14} /> 2. Property Assignment
            </h4>
            <div className="form-grid">
              <div
                className="input-field full-width dropdown-container"
                ref={dropdownRef}
              >
                <label>Assigned Hotel *</label>
                <div className="search-input-wrapper">
                  <Search className="search-icon" size={16} />
                  <input
                    type="text"
                    placeholder="Search by hotel name or city..."
                    value={hotelSearch}
                    onChange={(e) => {
                      setHotelSearch(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                  />
                  <button
                    type="button"
                    className="dropdown-toggle"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    {showDropdown ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                </div>

                {showDropdown && (
                  <div className="search-results-list">
                    {displayHotels.length > 0 ? (
                      displayHotels.map((h) => (
                        <div
                          key={h.id}
                          className="result-item"
                          onClick={() => {
                            setStaffData({
                              ...staffData,
                              assigned_hotel_id: h.id,
                              assigned_hotel_name: h.hotel_name,
                            });
                            setHotelSearch(h.hotel_name);
                            setShowDropdown(false);
                          }}
                        >
                          <strong>{h.hotel_name}</strong>
                          <span>
                            {h.city}, {h.state}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="no-results">No properties found</div>
                    )}
                  </div>
                )}

                {staffData.assigned_hotel_name && (
                  <div className="selected-badge">
                    Currently Selected:{" "}
                    <strong>{staffData.assigned_hotel_name}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStaff;
