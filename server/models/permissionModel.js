const pool = require("../db");

const getRolePermissions = async () => {
  const query = `
    SELECT r.id as role_id, r.role_name, 
           COALESCE(array_agg(p.id) FILTER (WHERE p.id IS NOT NULL), '{}') as permission_ids
    FROM roles r
    LEFT JOIN role_permissions rp ON r.id = rp.role_id
    LEFT JOIN permissions p ON rp.permission_id = p.id
    GROUP BY r.id, r.role_name
    ORDER BY r.id;
  `;
  const data = await pool.query(query);
  return data.rows;
};

const getAllPermissions = async () => {
  const data = await pool.query("SELECT * FROM permissions ORDER BY id");
  return data.rows;
};

const addRolePermission = async (role_id, permission_id) => {
  await pool.query(
    "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [role_id, permission_id],
  );
};

const removeRolePermission = async (role_id, permission_id) => {
  await pool.query(
    "DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2",
    [role_id, permission_id],
  );
};

const checkUserPermission = async (roleName, pageName) => {
  const query = `
    SELECT p.page_name 
    FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    JOIN roles r ON r.id = rp.role_id
    WHERE r.role_name = $1 AND p.page_name = $2
  `;
  const result = await pool.query(query, [roleName, pageName]);
  return result.rows.length > 0;
};

module.exports = {
  getRolePermissions,
  getAllPermissions,
  addRolePermission,
  removeRolePermission,
  checkUserPermission,
};
