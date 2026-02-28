import React, { useState, useEffect } from "react";
import {
  useParams,
  useNavigate,
  useOutletContext,
  useLocation,
} from "react-router-dom";
import API from "../../../api/axios";
import RoomCard from "../../../components/RoomCard/RoomCard";
import HotelCard from "../../../components/HotelCard/HotelCard";
import { toast } from "react-toastify";
import "./RoomSelection.scss";

const RoomSelection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { openModal, serverUrl, checkIn, checkOut } = useOutletContext();
  const [hotel, setHotel] = useState(null);

  const savedBooking = JSON.parse(
    localStorage.getItem("pendingBooking") || "{}",
  );
  const activeCheckIn =
    checkIn || location.state?.checkInDate || savedBooking.checkInDate;
  const activeCheckOut =
    checkOut || location.state?.checkOutDate || savedBooking.checkOutDate;

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        const res = await API.get(`api/hotels/online`);
        const found = res.data.find((h) => h.id === parseInt(id));
        setHotel(found);
      } catch (err) {
        console.error("Error fetching hotel details:", err);
      }
    };
    fetchHotelDetails();
  }, [id]);

  const handleBookRoom = (room) => {
    if (!activeCheckIn || !activeCheckOut) {
      return toast.error("Please select check-in and check-out dates first.");
    }

    const diffDays = Math.ceil(
      Math.abs(new Date(activeCheckOut) - new Date(activeCheckIn)) /
        (1000 * 60 * 60 * 24),
    );

    const bookingData = {
      hotel,
      roomType: room.room_type,
      totalNights: diffDays,
      totalPrice: diffDays * Number(room.price_per_night),
      checkInDate: activeCheckIn,
      checkOutDate: activeCheckOut,
    };

    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      toast.info("Please login to complete your booking.");
      localStorage.setItem("pendingBooking", JSON.stringify(bookingData));
      navigate("/login?redirect=checkout");
      return;
    }

    navigate("/checkout", { state: bookingData });
  };

  if (!hotel) return <div className="loader">Loading Hotel Details...</div>;

  return (
    <div className="room-selection-view">
      <button
        className="back-btn"
        onClick={() =>
          navigate("/", {
            state: { checkInDate: activeCheckIn, checkOutDate: activeCheckOut },
          })
        }
      >
        ← Back to Hotels
      </button>

      <div className="hotel-header-wrapper">
        <HotelCard
          h={hotel}
          isHeaderView={true}
          hideHeaderImage={true}
          serverUrl={serverUrl}
          openModal={openModal}
        />
      </div>

      <div className="photo-masonry-grid">
        <div
          className="main-photo"
          onClick={() => openModal(hotel.images_from_table, 0)}
        >
          <img
            src={`${serverUrl}${hotel.images_from_table[0]}`}
            alt="Main Feature"
          />
        </div>

        <div className="side-photos">
          {hotel.images_from_table.slice(1, 5).map((img, idx) => (
            <div
              key={idx}
              className="side-photo-item"
              onClick={() => openModal(hotel.images_from_table, idx + 1)}
            >
              <img src={`${serverUrl}${img}`} alt={`Hotel Thumbnail ${idx}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="rooms-grid">
        <h2 className="grid-title">Available Rooms</h2>
        {hotel.rooms?.map((room, idx) => (
          <RoomCard
            key={idx}
            room={room}
            serverUrl={serverUrl}
            onBookClick={handleBookRoom}
            openModal={openModal}
          />
        ))}
      </div>
    </div>
  );
};

export default RoomSelection;
