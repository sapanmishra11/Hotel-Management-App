import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import API from "../../api/axios";
import BookingCard from "../../components/BookingCard/BookingCard";
import "./StaffDashboard.scss";

const serverUrl = process.env.REACT_APP_API_URL;
const socket = io(serverUrl);

const StaffDashboard = () => {
  const [activeBookings, setActiveBookings] = useState([]);
  const [checkoutHistory, setCheckoutHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [editableId, setEditableId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const activeUrlPage = parseInt(queryParams.get("activePage")) || 1;
  const historyUrlPage = parseInt(queryParams.get("historyPage")) || 1;

  const [activePagination, setActivePagination] = useState({
    currentPage: activeUrlPage,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });

  const [historyPagination, setHistoryPagination] = useState({
    currentPage: historyUrlPage,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });

  const hotelId = localStorage.getItem("assigned_hotel_id");
  const [hotelName, setHotelName] = useState(
    localStorage.getItem("assigned_hotel_name") || "Loading...",
  );

  const fetchDashboardData = useCallback(async () => {
    if (!hotelId) return;
    setIsLoading(true);
    try {
      const [res, hotelRes] = await Promise.all([
        API.get(`/api/bookings/hotel/${hotelId}/paginated`, {
          params: {
            activePage: activeUrlPage,
            historyPage: historyUrlPage,
            limit: 10,
          },
        }),
        API.get(`/api/hotels/${hotelId}`),
      ]);

      if (res.data) {
        setActiveBookings(res.data.active.data);
        setActivePagination(res.data.active.pagination);
        setCheckoutHistory(res.data.history.data);
        setHistoryPagination(res.data.history.pagination);
      }

      if (hotelRes.data && hotelRes.data.hotel_name) {
        setHotelName(hotelRes.data.hotel_name);
        localStorage.setItem("assigned_hotel_name", hotelRes.data.hotel_name);
      }
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      toast.error("Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, [hotelId, activeUrlPage, historyUrlPage]);

  useEffect(() => {
    fetchDashboardData();
    socket.emit("join_hotel_room", hotelId);
    socket.on("new_booking_alert", () => fetchDashboardData());
    return () => socket.off("new_booking_alert");
  }, [hotelId, fetchDashboardData]);

  const handlePageChange = (type, pageNum) => {
    const params = new URLSearchParams(location.search);
    if (type === "active") {
      params.set("activePage", pageNum);
    } else {
      params.set("historyPage", pageNum);
    }
    navigate(`${location.pathname}?${params.toString()}`);
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    setUpdatingId(bookingId);
    try {
      await API.patch(`/api/bookings/status/${bookingId}`, {
        status: newStatus,
      });
      toast.success(`Status updated to ${newStatus}`);
      setEditableId(null);
      fetchDashboardData();
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleForceEditRequest = (id) => {
    const Msg = ({ closeToast }) => (
      <div className="custom-confirm-toast">
        <p
          style={{
            marginBottom: "12px",
            fontSize: "14px",
            fontWeight: "600",
            color: "#1e293b",
          }}
        >
          Are you sure you want to edit this booking status?
        </p>
        <div
          style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}
        >
          <button
            onClick={() => {
              setEditableId(id);
              closeToast();
              toast.info(`Editing enabled for Booking #${id}`);
            }}
            style={{
              padding: "6px 12px",
              background: "#0071c2",
              border: "none",
              color: "white",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Yes, Edit
          </button>
          <button
            onClick={closeToast}
            style={{
              padding: "6px 12px",
              background: "#e2e8f0",
              border: "none",
              color: "#475569",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            No
          </button>
        </div>
      </div>
    );

    toast.warn(<Msg />, {
      position: "top-center",
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      closeButton: false,
      theme: "light",
    });
  };

  const RenderPaginationBar = ({ pagination, type, label }) => (
    <div className="pagination-footer">
      <div className="entries-info">
        Showing{" "}
        <span>{(pagination.currentPage - 1) * pagination.limit + 1}</span> to{" "}
        <span>
          {Math.min(
            pagination.currentPage * pagination.limit,
            pagination.totalItems,
          )}
        </span>{" "}
        of <span>{pagination.totalItems}</span> {label}
      </div>

      <div className="pagination-controls">
        <button
          disabled={pagination.currentPage === 1}
          onClick={() => handlePageChange(type, pagination.currentPage - 1)}
        >
          Previous
        </button>
        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
          (num) => (
            <button
              key={num}
              className={pagination.currentPage === num ? "active" : ""}
              onClick={() => handlePageChange(type, num)}
            >
              {num}
            </button>
          ),
        )}
        <button
          disabled={pagination.currentPage === pagination.totalPages}
          onClick={() => handlePageChange(type, pagination.currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <div className="staff-dashboard">
      <nav className="staff-nav">
        <h2>Staff Portal - {hotelName}</h2>
        <span className="live-indicator">Live Updates Active</span>
      </nav>

      <div
        className="dashboard-content"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(0, 1fr))",
          gap: "20px",
          padding: "20px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          className="table-wrapper boxed-layout"
          style={{ margin: 0, padding: "20px" }}
        >
          <h3
            style={{
              borderBottom: "2px solid #f59e0b",
              paddingBottom: "10px",
              marginBottom: "20px",
            }}
          >
            Active Bookings ({activePagination.totalItems})
          </h3>
          <div className="booking-cards">
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              activeBookings.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  onStatusChange={handleStatusChange}
                  onForceEditRequest={handleForceEditRequest}
                  updatingId={updatingId}
                  editableId={editableId}
                />
              ))
            )}
          </div>
          {!isLoading && activePagination.totalItems > 0 && (
            <RenderPaginationBar
              pagination={activePagination}
              type="active"
              label="bookings"
            />
          )}
        </div>

        <div
          className="table-wrapper boxed-layout"
          style={{ margin: 0, padding: "20px" }}
        >
          <h3
            style={{
              borderBottom: "2px solid #94a3b8",
              paddingBottom: "10px",
              marginBottom: "20px",
            }}
          >
            Checked Out ({historyPagination.totalItems})
          </h3>
          <div className="booking-cards">
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              checkoutHistory.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  isHistory={true}
                  onStatusChange={handleStatusChange}
                  onForceEditRequest={handleForceEditRequest}
                  updatingId={updatingId}
                  editableId={editableId}
                />
              ))
            )}
          </div>
          {!isLoading && historyPagination.totalItems > 0 && (
            <RenderPaginationBar
              pagination={historyPagination}
              type="history"
              label="past records"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
