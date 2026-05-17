const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");

const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || httpStatus[statusCode];
    error = new ApiError(statusCode, message);
  }
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const { statusCode, message } = err;
  const response = {
    code: statusCode,
    message,
  };
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }
  res.status(statusCode).json(response);
};

module.exports = { errorConverter, errorHandler };
