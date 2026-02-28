import React from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import API from "../../../api/axios";
import HotelCard from "../../../components/HotelCard/HotelCard";
import { toast } from "react-toastify";
import "./HotelList.scss";

const HotelList = () => {
  const { openModal, serverUrl, hotels, loading, checkIn, checkOut } =
    useOutletContext();

  const navigate = useNavigate();

  const handleSeeAvailability = (hotel) => {
    if (!checkIn || !checkOut) {
      return toast.warn("Please select Check-In and Check-Out dates first!");
    }

    navigate(`/hotel/${hotel.id}`, {
      state: {
        checkInDate: checkIn,
        checkOutDate: checkOut,
      },
    });
  };

  return (
    <div className="results-container">
      {loading ? (
        <div className="loader">Searching...</div>
      ) : (
        <div className="hotel-list">
          {hotels.map((h) => (
            <HotelCard
              key={h.id}
              h={h}
              serverUrl={serverUrl}
              onHotelClick={handleSeeAvailability}
              openModal={openModal}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HotelList;
