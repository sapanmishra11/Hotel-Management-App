const pool = require("../db");

const findUserByEmail = async (email) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return result.rows[0];
};

const findUserById = async (id) => {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return result.rows[0];
};

const createUser = async (
  username,
  email,
  phone,
  user_type,
  setupToken,
  expiry,
  status,
) => {
  const result = await pool.query(
    "INSERT INTO users (username, email, phone, user_type, setup_token, token_expiry, status) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    [username, email, phone, user_type, setupToken, expiry, status],
  );
  return result.rows[0];
};

const createStaff = async (
  username,
  email,
  phone,
  assigned_hotel_id,
  passwordHash,
  setupToken,
  expiry,
) => {
  const result = await pool.query(
    `INSERT INTO users (username, email, phone, user_type, assigned_hotel_id, password_hash, setup_token, token_expiry, status) 
     VALUES($1, $2, $3, 'Staff', $4, $5, $6, $7, 'pending') RETURNING id, email`,
    [
      username,
      email,
      phone,
      assigned_hotel_id,
      passwordHash,
      setupToken,
      expiry,
    ],
  );
  return result.rows[0];
};

const getStaffList = async () => {
  const result = await pool.query(`
    SELECT u.id, u.username, u.email, u.phone, u.assigned_hotel_id, h.hotel_name 
    FROM users u 
    LEFT JOIN hotels h ON u.assigned_hotel_id = h.id 
    WHERE u.user_type = 'Staff'
    ORDER BY u.created_at DESC
  `);
  return result.rows;
};

const updateStaffWithEmail = async (
  id,
  username,
  email,
  phone,
  assigned_hotel_id,
  setupToken,
  expiry,
) => {
  await pool.query(
    `UPDATE users 
     SET username = $1, email = $2, phone = $3, assigned_hotel_id = $4, 
         status = 'pending', setup_token = $5, token_expiry = $6, password_hash = NULL 
     WHERE id = $7`,
    [username, email, phone, assigned_hotel_id, setupToken, expiry, id],
  );
};

const updateStaffWithoutEmail = async (
  id,
  username,
  phone,
  assigned_hotel_id,
) => {
  await pool.query(
    "UPDATE users SET username = $1, phone = $2, assigned_hotel_id = $3 WHERE id = $4",
    [username, phone, assigned_hotel_id, id],
  );
};

const deleteStaff = async (id) => {
  await pool.query("DELETE FROM users WHERE id = $1 AND user_type = 'Staff'", [
    id,
  ]);
};

const updatePasswordByToken = async (passwordHash, token) => {
  const result = await pool.query(
    "UPDATE users SET password_hash = $1, setup_token = NULL, token_expiry = NULL, status = 'active' WHERE setup_token = $2 AND token_expiry > NOW() RETURNING id",
    [passwordHash, token],
  );
  return result.rows[0];
};

const getRolePermissions = async (user_type) => {
  const result = await pool.query(
    `SELECT p.page_name 
     FROM permissions p
     JOIN role_permissions rp ON p.id = rp.permission_id
     JOIN roles r ON r.id = rp.role_id
     WHERE r.role_name = $1`,
    [user_type],
  );
  return result.rows.map((row) => row.page_name);
};

const checkDuplicateAccount = async (email, phone, id) => {
  const result = await pool.query(
    "SELECT id FROM users WHERE (email = $1 OR phone = $2) AND id != $3",
    [email, phone, id],
  );
  return result.rows;
};

const updateAccountEmail = async (id, email, setupToken, expiry) => {
  await pool.query(
    "UPDATE users SET email = $1, status = 'pending', setup_token = $2, token_expiry = $3 WHERE id = $4",
    [email, setupToken, expiry, id],
  );
};

const updateAccountPassword = async (id, passwordHash) => {
  await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
    passwordHash,
    id,
  ]);
};

const updateAccountDetails = async (id, username, phone) => {
  await pool.query("UPDATE users SET username = $1, phone = $2 WHERE id = $3", [
    username,
    phone,
    id,
  ]);
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  createStaff,
  getStaffList,
  updateStaffWithEmail,
  updateStaffWithoutEmail,
  deleteStaff,
  updatePasswordByToken,
  getRolePermissions,
  checkDuplicateAccount,
  updateAccountEmail,
  updateAccountPassword,
  updateAccountDetails,
};
