const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");

const authorization = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate"));
    }
    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      return next(new ApiError(httpStatus.FORBIDDEN, "Forbidden"));
    }
    next();
  };
};

module.exports = { authorization };
