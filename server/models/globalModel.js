const pool = require("../db");

const getGlobalDetails = async () => {
  const query = `SELECT * FROM global_hotel_details LIMIT 1`;
  const result = await pool.query(query);
  return result.rows[0];
};

const updateGlobalDetails = async (data) => {
  const {
    hotel_name,
    hero_title,
    hero_image,
    welcome_title,
    welcome_description,
    feature1_title,
    feature1_description,
    feature1_image,
    feature2_title,
    feature2_description,
    feature2_image,
    feature3_title,
    feature3_description,
    feature3_image,
    contact_email,
    contact_phone,
    facebook_url,
    twitter_url,
    instagram_url,
  } = data;

  const query = `
    UPDATE global_hotel_details 
    SET 
      hotel_name = $1, hero_title = $2, hero_image = $3, welcome_title = $4, welcome_description = $5,
      feature1_title = $6, feature1_description = $7, feature1_image = $8,
      feature2_title = $9, feature2_description = $10, feature2_image = $11,
      feature3_title = $12, feature3_description = $13, feature3_image = $14,
      contact_email = $15, contact_phone = $16, facebook_url = $17, 
      twitter_url = $18, instagram_url = $19,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = (SELECT id FROM global_hotel_details LIMIT 1)
    RETURNING *`;

  const values = [
    hotel_name,
    hero_title,
    hero_image,
    welcome_title,
    welcome_description,
    feature1_title,
    feature1_description,
    feature1_image,
    feature2_title,
    feature2_description,
    feature2_image,
    feature3_title,
    feature3_description,
    feature3_image,
    contact_email,
    contact_phone,
    facebook_url,
    twitter_url,
    instagram_url,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const getHotelName = async () => {
  const result = await pool.query(
    "SELECT hotel_name FROM global_hotel_details LIMIT 1",
  );
  return result.rows[0];
};

module.exports = { getGlobalDetails, updateGlobalDetails, getHotelName };
