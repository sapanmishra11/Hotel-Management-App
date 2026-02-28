import React, { useEffect, useState } from "react";
import API from "../../../api/axios";
import BookingItem from "../../../components/UserDashboard/BookingItem";
import "./UserDashboard.scss";

const UserDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const serverUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchMyBookings = async () => {
      try {
        const res = await API.get("api/bookings/my-bookings");
        setBookings(res.data);
      } catch (err) {
        console.error("Error fetching bookings");
      } finally {
        setLoading(false);
      }
    };
    fetchMyBookings();
  }, []);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>My Bookings</h1>
        <p>Check your upcoming and past stays</p>
      </header>

      {loading ? (
        <div className="loader">Loading your trips...</div>
      ) : (
        <div className="bookings-list">
          {bookings.length > 0 ? (
            bookings.map((b) => (
              <BookingItem key={b.id} booking={b} serverUrl={serverUrl} />
            ))
          ) : (
            <div className="empty-state">
              <h3>No bookings found</h3>
              <p>Looks like you haven't planned any trips yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
