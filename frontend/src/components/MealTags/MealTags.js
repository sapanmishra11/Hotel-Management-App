import React from "react";
import "./MealTags.scss";

const MealTags = ({ meals }) => {
  if (!meals || meals.length === 0) {
    return (
      <span className="text-muted" style={{ fontStyle: "italic" }}>
        Room Only
      </span>
    );
  }

  return (
    <div
      className="meal-tags-container"
      style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}
    >
      {meals.map((m, index) => (
        <span
          key={index}
          className="meal-pill"
          style={{
            background: "#eff6ff",
            color: "#1e40af",
            padding: "4px 10px",
            borderRadius: "12px",
            fontSize: "0.8rem",
            border: "1px solid #dbeafe",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {typeof m === "string" ? (
            m
          ) : (
            <>
              <strong
                style={{
                  fontSize: "0.65rem",
                  textTransform: "uppercase",
                  color: "#3b82f6",
                }}
              >
                {m.meal_category}
              </strong>
              <span>
                {m.dish_name} ({m.dietary_type})
              </span>
            </>
          )}
        </span>
      ))}
    </div>
  );
};

export default MealTags;
