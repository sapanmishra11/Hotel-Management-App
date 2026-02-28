import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  User as UserIcon,
  Mail,
  Phone,
  Hotel,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import API from "../../../../api/axios";
import { toast } from "react-toastify";

const EditStaff = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [hotelSearch, setHotelSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [staffData, setStaffData] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    assigned_hotel_id: "",
    assigned_hotel_name: "",
  });

  useEffect(() => {
    const initializeData = async () => {
      try {
        const passedData = location.state?.staffMember;

        if (passedData) {
          setStaffData({
            username: passedData.username || "",
            email: passedData.email || "",
            phoneNumber: passedData.phone || "",
            assigned_hotel_id: passedData.assigned_hotel_id || "",
            assigned_hotel_name: passedData.hotel_name || "",
          });
          setHotelSearch(passedData.hotel_name || "");
        } else {
          const staffRes = await API.get(`api/auth/staff/${id}`);
          if (staffRes.data) {
            const s = staffRes.data;
            setStaffData({
              username: s.username || "",
              email: s.email || "",
              phoneNumber: s.phone || "",
              assigned_hotel_id: s.assigned_hotel_id || "",
              assigned_hotel_name: s.hotel_name || "",
            });
            setHotelSearch(s.hotel_name || "");
          }
        }

        const hotelsRes = await API.get("api/hotels/all");
        setHotels(hotelsRes.data);
      } catch (err) {
        console.error("Fetch Error:", err);
        toast.error("Failed to load staff information");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    initializeData();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [id, navigate, location.state]);

  const validateForm = () => {
    const { username, email, phoneNumber, assigned_hotel_id } = staffData;
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
      toast.error("Phone number must be exactly 10 digits");
      return false;
    }
    if (!assigned_hotel_id) {
      toast.error("Please assign a hotel property");
      return false;
    }
    return true;
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsProcessing(true);
    try {
      const payload = {
        username: staffData.username,
        email: staffData.email,
        phone: staffData.phoneNumber,
        assigned_hotel_id: staffData.assigned_hotel_id,
      };

      await API.put(`api/auth/update-staff/${id}`, payload);
      toast.success("Staff profile updated successfully!");
      navigate(-1);
    } catch (err) {
      toast.error("Update failed");
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
    : hotels;

  if (loading) {
    return (
      <div
        className="admin-container"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "600px",
        }}
      >
        <Loader2 className="animate-spin" size={48} color="#2563eb" />
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="form-header-toolbar">
        <button onClick={() => navigate(-1)} className="back-link">
          <ArrowLeft size={16} /> Back to Staff Directory
        </button>
        <div className="breadcrumb">
          <span>Staff Management</span> / <strong>Edit Personnel</strong>
        </div>
      </div>

      <div className="table-wrapper boxed-layout">
        <div className="table-header">
          <div className="title-section">
            <h2>Edit Staff Member</h2>
            <p>Modify details and assignments for Staff ID: #{id}</p>
          </div>
          <div className="header-actions">
            <button
              className="add-btn"
              onClick={handleUpdateStaff}
              disabled={isProcessing}
            >
              <Save size={16} /> {isProcessing ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="form-sections">
          <div className="form-card">
            <h4 className="section-title">
              <UserIcon size={14} /> 1. Personal Information
            </h4>
            <div className="form-grid">
              <div className="input-field">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="Legal name"
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
                  placeholder="admin@hotel.com"
                  value={staffData.email}
                  onChange={(e) =>
                    setStaffData({ ...staffData, email: e.target.value })
                  }
                />
              </div>
              <div className="input-field full-width">
                <label>Mobile Number *</label>
                <input
                  type="text"
                  placeholder="10 digit number"
                  maxLength={10}
                  value={staffData.phoneNumber}
                  onChange={(e) =>
                    setStaffData({
                      ...staffData,
                      phoneNumber: e.target.value.replace(/\D/g, ""),
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="form-card dropdown-card">
            <h4 className="section-title">
              <Hotel size={14} /> 2. Update Property Assignment
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
                    placeholder="Change hotel assignment..."
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
                    Currently Assigned:{" "}
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

export default EditStaff;
