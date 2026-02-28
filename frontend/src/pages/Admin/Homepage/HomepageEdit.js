import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../../api/axios";
import {
  FaArrowLeft,
  FaGlobe,
  FaImage,
  FaInfoCircle,
  FaThLarge,
  FaEnvelope,
  FaPhone,
  FaShareAlt,
  FaSave,
  FaUpload,
} from "react-icons/fa";
import "./HomepageEdit.scss";

const HotelGlobalInfo = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    hotel_name: "",
    hero_title: "",
    hero_image: "",
    welcome_title: "",
    welcome_description: "",
    feature1_title: "",
    feature1_description: "",
    feature1_image: "",
    feature2_title: "",
    feature2_description: "",
    feature2_image: "",
    feature3_title: "",
    feature3_description: "",
    feature3_image: "",
    contact_email: "",
    contact_phone: "",
    facebook_url: "",
    twitter_url: "",
    instagram_url: "",
  });

  const heroInputRef = useRef(null);
  const f1InputRef = useRef(null);
  const f2InputRef = useRef(null);
  const f3InputRef = useRef(null);

  useEffect(() => {
    fetchCurrentSettings();
  }, []);

  const fetchCurrentSettings = async () => {
    try {
      const res = await API.get("/api/globaldetails/details");
      if (res.data) {
        setFormData(res.data);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      toast.error("Failed to load current settings");
    }
  };

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("image", file);

    setUploading(true);
    try {
      const res = await API.post("/api/globaldetails/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFormData((prev) => ({ ...prev, [fieldName]: res.data.imageUrl }));
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.put("/api/globaldetails/update", formData);
      toast.success("Homepage details updated successfully!");
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Error updating details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="form-header-toolbar">
        <button className="back-link" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>
      </div>

      <div className="table-wrapper boxed-layout">
        <div className="table-header">
          <div className="title-section">
            <h2>Manage Homepage Content</h2>
            <p>Update branding, hero sections, and feature highlights</p>
          </div>
          <button
            className="add-btn"
            onClick={handleSubmit}
            disabled={loading || uploading}
          >
            <FaSave /> {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <form className="form-sections" onSubmit={handleSubmit}>
          <div className="form-card">
            <div className="section-title">
              <FaGlobe /> General Branding
            </div>
            <div className="form-grid">
              <div className="input-field full-width">
                <label>Hotel Display Name</label>
                <input
                  type="text"
                  name="hotel_name"
                  value={formData.hotel_name}
                  onChange={handleChange}
                  placeholder="e.g. Hotel Palace"
                />
              </div>
            </div>
          </div>

          <div className="form-card">
            <div className="section-title">
              <FaImage /> Hero Section
            </div>
            <div className="form-grid">
              <div className="input-field">
                <label>Hero Title</label>
                <input
                  type="text"
                  name="hero_title"
                  value={formData.hero_title}
                  onChange={handleChange}
                />
              </div>
              <div className="input-field">
                <label>Hero Image</label>
                <div className="upload-input-group">
                  <input
                    type="text"
                    name="hero_image"
                    value={formData.hero_image}
                    onChange={handleChange}
                    placeholder="Path or Upload"
                  />
                  <input
                    type="file"
                    hidden
                    ref={heroInputRef}
                    onChange={(e) => handleFileUpload(e, "hero_image")}
                  />
                  <button
                    type="button"
                    className="upload-trigger"
                    onClick={() => heroInputRef.current.click()}
                  >
                    <FaUpload />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="form-card">
            <div className="section-title">
              <FaInfoCircle /> Welcome Introduction
            </div>
            <div className="form-grid">
              <div className="input-field full-width">
                <label>Welcome Title</label>
                <input
                  type="text"
                  name="welcome_title"
                  value={formData.welcome_title}
                  onChange={handleChange}
                />
              </div>
              <div className="input-field full-width">
                <label>Welcome Description</label>
                <textarea
                  name="welcome_description"
                  rows="3"
                  value={formData.welcome_description}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>
          </div>

          <div className="form-card">
            <div className="section-title">
              <FaThLarge /> Feature Blocks (Staggered Grid)
            </div>
            <div className="form-grid">
              <div className="input-field">
                <label>Feature 1 Title</label>
                <input
                  type="text"
                  name="feature1_title"
                  value={formData.feature1_title}
                  onChange={handleChange}
                />
              </div>
              <div className="input-field">
                <label>Feature 1 Image</label>
                <div className="upload-input-group">
                  <input
                    type="text"
                    name="feature1_image"
                    value={formData.feature1_image}
                    onChange={handleChange}
                  />
                  <input
                    type="file"
                    hidden
                    ref={f1InputRef}
                    onChange={(e) => handleFileUpload(e, "feature1_image")}
                  />
                  <button
                    type="button"
                    className="upload-trigger"
                    onClick={() => f1InputRef.current.click()}
                  >
                    <FaUpload />
                  </button>
                </div>
              </div>
              <div className="input-field full-width">
                <label>Feature 1 Description</label>
                <textarea
                  name="feature1_description"
                  value={formData.feature1_description}
                  onChange={handleChange}
                ></textarea>
              </div>

              <div className="input-field">
                <label>Feature 2 Title</label>
                <input
                  type="text"
                  name="feature2_title"
                  value={formData.feature2_title}
                  onChange={handleChange}
                />
              </div>
              <div className="input-field">
                <label>Feature 2 Image</label>
                <div className="upload-input-group">
                  <input
                    type="text"
                    name="feature2_image"
                    value={formData.feature2_image}
                    onChange={handleChange}
                  />
                  <input
                    type="file"
                    hidden
                    ref={f2InputRef}
                    onChange={(e) => handleFileUpload(e, "feature2_image")}
                  />
                  <button
                    type="button"
                    className="upload-trigger"
                    onClick={() => f2InputRef.current.click()}
                  >
                    <FaUpload />
                  </button>
                </div>
              </div>
              <div className="input-field full-width">
                <label>Feature 2 Description</label>
                <textarea
                  name="feature2_description"
                  value={formData.feature2_description}
                  onChange={handleChange}
                ></textarea>
              </div>

              <div className="input-field">
                <label>Feature 3 Title</label>
                <input
                  type="text"
                  name="feature3_title"
                  value={formData.feature3_title}
                  onChange={handleChange}
                />
              </div>
              <div className="input-field">
                <label>Feature 3 Image</label>
                <div className="upload-input-group">
                  <input
                    type="text"
                    name="feature3_image"
                    value={formData.feature3_image}
                    onChange={handleChange}
                  />
                  <input
                    type="file"
                    hidden
                    ref={f3InputRef}
                    onChange={(e) => handleFileUpload(e, "feature3_image")}
                  />
                  <button
                    type="button"
                    className="upload-trigger"
                    onClick={() => f3InputRef.current.click()}
                  >
                    <FaUpload />
                  </button>
                </div>
              </div>
              <div className="input-field full-width">
                <label>Feature 3 Description</label>
                <textarea
                  name="feature3_description"
                  value={formData.feature3_description}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>
          </div>

          <div className="form-card">
            <div className="section-title">
              <FaShareAlt /> Contact & Social Media
            </div>
            <div className="form-grid">
              <div className="input-field">
                <label>
                  <FaEnvelope /> Email Address
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleChange}
                />
              </div>
              <div className="input-field">
                <label>
                  <FaPhone /> Phone Number
                </label>
                <input
                  type="text"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                />
              </div>
              <div className="input-field">
                <label>Facebook URL</label>
                <input
                  type="text"
                  name="facebook_url"
                  value={formData.facebook_url}
                  onChange={handleChange}
                />
              </div>
              <div className="input-field">
                <label>Twitter URL</label>
                <input
                  type="text"
                  name="twitter_url"
                  value={formData.twitter_url}
                  onChange={handleChange}
                />
              </div>
              <div className="input-field">
                <label>Instagram URL</label>
                <input
                  type="text"
                  name="instagram_url"
                  value={formData.instagram_url}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HotelGlobalInfo;
