const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const authService = require("./auth.service");

const register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(httpStatus.CREATED).json(result);
});

const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(httpStatus.OK).json(result);
});

module.exports = { register, login };
