const permissionModel = require("../models/permissionModel");

const fetchRolePermissions = async (req, res) => {
  try {
    const roles = await permissionModel.getRolePermissions();
    res.json(roles);
  } catch (err) {
    console.error(err);
    res.status(500).json("Server Error fetching role permissions");
  }
};

const fetchAllPermissions = async (req, res) => {
  try {
    const permissions = await permissionModel.getAllPermissions();
    res.json(permissions);
  } catch (err) {
    console.error(err);
    res.status(500).json("Server Error fetching all permissions");
  }
};

const togglePermission = async (req, res) => {
  const { role_id, permission_id, action } = req.body;

  try {
    if (action === "add") {
      await permissionModel.addRolePermission(role_id, permission_id);
    } else if (action === "remove") {
      await permissionModel.removeRolePermission(role_id, permission_id);
    } else {
      return res.status(400).json("Invalid action provided");
    }

    res.status(200).json({ message: "Permission updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json("Update Failed");
  }
};

module.exports = {
  fetchRolePermissions,
  fetchAllPermissions,
  togglePermission,
};
