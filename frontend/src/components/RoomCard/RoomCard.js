import React, { useState } from "react";
import "./RoomCard.scss";

const RoomCard = ({ room, serverUrl, onBookClick, openModal }) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const images = room.room_images || [];

  const original = Number(room.original_price) || 0;
  const discounted = Number(room.price_per_night) || 0;
  let discountPercentage = 0;

  if (original > discounted && discounted > 0) {
    discountPercentage = Math.round(((original - discounted) / original) * 100);
  }

  const nextImage = (e) => {
    e.stopPropagation();
    if (images.length > 0)
      setCurrentImgIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (images.length > 0)
      setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="room-card">
      <div className="room-img-container">
        {discountPercentage > 0 && (
          <div className="discount-badge">{discountPercentage}% OFF</div>
        )}

        <img
          src={
            images.length > 0
              ? `${serverUrl}${images[currentImgIndex]}`
              : "/default-hotel.jpg"
          }
          alt={room.room_type}
          className="room-display-img clickable-img"
          onClick={() => openModal(room.room_images, currentImgIndex)}
        />
        {images.length > 1 && (
          <div className="room-gallery-overlay">
            <button className="nav-btn prev" onClick={prevImage}>
              ‹
            </button>
            <span className="img-counter">
              {currentImgIndex + 1} / {images.length}
            </span>
            <button className="nav-btn next" onClick={nextImage}>
              ›
            </button>
          </div>
        )}
      </div>
      <div className="room-info">
        <h3>{room.room_type}</h3>
        <p className="desc full-text">{room.room_description}</p>
      </div>
      <div className="room-action">
        <div className="price-container">
          {original > 0 && (
            <span className="original-price">
              <span className="strikethrough">
                ₹{original.toLocaleString("en-IN")}
              </span>
            </span>
          )}
          <div className="offer-price">
            <span className="amt">₹{discounted.toLocaleString("en-IN")}</span>
            <span className="unit">INR</span>
          </div>
          <span className="per-night">per night</span>
        </div>
        <button className="select-room-btn" onClick={() => onBookClick(room)}>
          Book Now
        </button>
      </div>
    </div>
  );
};

export default RoomCard;
