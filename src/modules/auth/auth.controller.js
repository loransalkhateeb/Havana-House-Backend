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

const refreshTokens = catchAsync(async (req, res) => {
  const result = await authService.refreshTokens(req.body.refreshToken);
  res.status(httpStatus.OK).json(result);
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = { register, login, refreshTokens, logout };
