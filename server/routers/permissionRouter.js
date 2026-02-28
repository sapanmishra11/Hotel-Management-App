const express = require("express");
const router = express.Router();
const permissionController = require("../controllers/permissionController");

router.get("/role-permissions", permissionController.fetchRolePermissions);

router.get("/all-permissions", permissionController.fetchAllPermissions);

router.post("/toggle-permission", permissionController.togglePermission);

module.exports = router;
