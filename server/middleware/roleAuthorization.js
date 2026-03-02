const jwt = require("jsonwebtoken");
const authModel = require("../models/authModel");

module.exports = (requiredRoles) => {
  return async (req, res, next) => {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res
        .status(403)
        .json({ message: "Access Denied: No token provided" });
    }

    let token;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      token = authHeader;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      req.user = decoded;

      const user = await authModel.findUserById(req.user.id);

      if (!user || user.is_active === false) {
        return res.status(403).json({
          message: "Account deactivated. Access denied.",
          isDeactivated: true,
        });
      }

      if (requiredRoles) {
        const rolesArray = Array.isArray(requiredRoles)
          ? requiredRoles
          : [requiredRoles];

        if (!rolesArray.includes(req.user.role)) {
          return res
            .status(403)
            .json({ message: "Access Denied: Insufficient Permissions" });
        }
      }

      next();
    } catch (err) {
      console.error("Auth Middleware Error:", err.message);
      res.status(401).json({ message: "Token expired or invalid" });
    }
  };
};
