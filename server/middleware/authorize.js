const jwt = require("jsonwebtoken");
const PermissionModel = require("../models/permissionModel");

module.exports = (requiredPermission) => {
  return async (req, res, next) => {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res
        .status(403)
        .json({ message: "Access Denied: No token provided" });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      req.user = decoded;

      if (requiredPermission) {
        const hasPermission = await PermissionModel.checkUserPermission(
          req.user.role,
          requiredPermission,
        );

        if (!hasPermission) {
          return res.status(403).json({
            message: `Access Denied: You do not have the '${requiredPermission}' permission.`,
          });
        }
      }
      next();
    } catch (err) {
      console.error("Auth Middleware Error:", err.message);
      res.status(401).json({ message: "Token expired or invalid" });
    }
  };
};
