const jwt = require("jsonwebtoken");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const config = require("../config");

const auth = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = decoded;

      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        throw new ApiError(httpStatus.FORBIDDEN, "Forbidden");
      }

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        return next(error);
      }
      next(new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate"));
    }
  };
};

module.exports = { auth };
