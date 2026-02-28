import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import API from "../../api/axios";
import { toast } from "react-toastify";
import "./AccountSettings.scss";

const AccountSettings = () => {
  const { userId } = useParams();
  const [loading, setLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [originalEmail, setOriginalEmail] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await API.get(`/api/auth/users/${userId}`);
        const data = res.data;
        setFormData((prev) => ({
          ...prev,
          username: data.username,
          email: data.email,
          phone: data.phone || "",
        }));
        setOriginalEmail(data.email);
      } catch (err) {
        toast.error("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [userId]);

  const validate = () => {
    const phoneRegex = /^[0-9]{10}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.username.trim()) {
      toast.error("Username cannot be empty");
      return false;
    }
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      toast.error("Phone number must be exactly 10 digits");
      return false;
    }
    if (formData.email !== originalEmail && !formData.currentPassword) {
      toast.error("Current password is required to change your email address");
      return false;
    }
    if (showPasswordForm) {
      if (!formData.currentPassword) {
        toast.error("Current password is required to set a new one");
        return false;
      }
      if (formData.newPassword.length < 6) {
        toast.error("New password must be at least 6 characters");
        return false;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error("New passwords do not match");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsProcessing(true);

    try {
      const res = await API.put(`/api/auth/update-account/${userId}`, formData);

      if (res.data.emailUpdated) {
        toast.success("Profile updated! Please verify your new email.");
        setOriginalEmail(formData.email);
      } else {
        toast.success("Account updated successfully!");
      }

      localStorage.setItem("userName", formData.username);
      setShowPasswordForm(false);
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (err) {
      const msg = err.response?.data?.message || "Update failed.";
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="loader">Loading settings...</div>;

  const isEmailChanged = formData.email !== originalEmail;

  return (
    <div className="settings-wrapper">
      <div className="settings-container">
        <h2>Account Settings</h2>

        <form onSubmit={handleSubmit}>
          <section className="settings-section">
            <h3>Edit Profile</h3>
            <br></br>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
              {isEmailChanged && (
                <small className="help-text warning">
                  Verification required to change your email.
                </small>
              )}
            </div>

            {isEmailChanged && !showPasswordForm && (
              <div className="password-form-fade verification-box">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Current Password</label>
                  <input
                    type="password"
                    placeholder="Enter current password to verify email change"
                    value={formData.currentPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                maxLength="10"
                placeholder="10-digit number"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    phone: e.target.value.replace(/\D/g, ""),
                  })
                }
              />
            </div>
          </section>

          <section className="settings-section">
            <div className="section-header">
              <h3 style={{ margin: 0 }}>Security & Password</h3>
              {!showPasswordForm && (
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowPasswordForm(true)}
                >
                  Change Password
                </button>
              )}
            </div>

            {showPasswordForm && (
              <div className="password-form-fade">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    placeholder="Enter current password to verify"
                    value={formData.currentPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={formData.newPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, newPassword: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowPasswordForm(false)}
                >
                  Cancel Password Change
                </button>
              </div>
            )}
          </section>
          <hr />
          <button
            type="submit"
            className={`btn-save ${isProcessing ? "processing" : ""}`}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Save All Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccountSettings;
