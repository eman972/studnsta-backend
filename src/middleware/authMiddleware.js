const jwt = require("jsonwebtoken");
const User = require("../models/user");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      // Feature 1: enforce real JWT expiry
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }
      if (user.isDeleted || user.isDeactivated) {
        return res.status(401).json({ message: "Account deactivated" });
      }
      if (user.tokenVersion != null && decoded.tokenVersion != null && decoded.tokenVersion !== user.tokenVersion) {
        return res.status(401).json({ message: "Session revoked" });
      }
      req.user = user;
      return next();
    } catch (error) {
      const message =
        error.name === "TokenExpiredError"
          ? "Token expired"
          : "Not authorized, token invalid";
      return res.status(401).json({ message, code: error.name });
    }
  }

  return res.status(401).json({ message: "No token provided" });
};

module.exports = protect;
