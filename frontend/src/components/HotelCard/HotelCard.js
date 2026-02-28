import React, { useState } from "react";
import "./HotelCard.scss";

const HotelCard = ({
  h,
  onHotelClick,
  openModal,
  isHeaderView = false,
  hideHeaderImage = false,
  serverUrl,
}) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const hotelImages = h.images_from_table || [];
  const original = Number(h.original_base_price);
  const discounted = Number(h.base_price);
  let discountPercentage = 0;

  if (original > 0 && discounted > 0 && original > discounted) {
    discountPercentage = Math.round(((original - discounted) / original) * 100);
  }
  const nextImage = (e) => {
    e.stopPropagation();
    if (hotelImages.length > 0)
      setCurrentImgIndex((prev) => (prev + 1) % hotelImages.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (hotelImages.length > 0)
      setCurrentImgIndex(
        (prev) => (prev - 1 + hotelImages.length) % hotelImages.length,
      );
  };

  return (
    <div
      className={`hotel-card-horizontal ${isHeaderView ? "selection-header-mode" : ""}`}
    >
      {!hideHeaderImage && (
        <div className="image-section">
          {discountPercentage > 0 && (
            <div className="discount-badge">{discountPercentage}% OFF</div>
          )}

          <img
            src={
              hotelImages[currentImgIndex]
                ? `${serverUrl}${hotelImages[currentImgIndex]}`
                : "/default-hotel.jpg"
            }
            alt={h.hotel_name}
            className="clickable-img"
            onClick={() => openModal(h.images_from_table, currentImgIndex)}
          />
          {hotelImages.length > 1 && !isHeaderView && (
            <div className="gallery-controls">
              <button className="gallery-btn prev" onClick={prevImage}>
                ‹
              </button>
              <button className="gallery-btn next" onClick={nextImage}>
                ›
              </button>
            </div>
          )}
        </div>
      )}

      <div className="content-section">
        <h3
          className="hotel-link"
          onClick={() => !isHeaderView && onHotelClick(h)}
        >
          {h.hotel_name}
        </h3>
        <p className="location-text">
          {h.city}, {h.state}
        </p>

        <div className="description-container">
          <p className="description full-text">{h.description}</p>
        </div>

        <div className="amenities-row">
          {Array.isArray(h.amenities) &&
            h.amenities.slice(0, 3).map((item) => (
              <span key={item} className="amenity-tag">
                ✔ {item}
              </span>
            ))}

          {Array.isArray(h.amenities) && h.amenities.length > 3 && (
            <div className="amenities-tooltip-container">
              <span className="tooltip-trigger">?</span>
              <div className="tooltip-content">
                <p className="tooltip-title">All Amenities:</p>
                <ul>
                  {h.amenities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isHeaderView && (
        <div className="price-section">
          <div className="price-container">
            {original > 0 && (
              <div className="original-price-wrapper">
                <span className="original-price">
                  From{" "}
                  <span className="strikethrough">
                    ₹{original.toLocaleString("en-IN")}
                  </span>
                </span>
              </div>
            )}

            <div className="offer-price-row">
              <span className="label-from">From</span>
              <span className="amt">₹{discounted.toLocaleString("en-IN")}</span>
              <span className="unit">INR</span>
            </div>
          </div>

          <button className="action-btn" onClick={() => onHotelClick(h)}>
            See Availability
          </button>
        </div>
      )}
    </div>
  );
};

export default HotelCard;
