const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const userService = require("./user.service");

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).json(user);
});

const getUsers = catchAsync(async (req, res) => {
  const users = await userService.getUsers();
  res.status(httpStatus.OK).json(users);
});

const getUserById = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.status(httpStatus.OK).json(user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.status(httpStatus.OK).json(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const getProfile = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.user.id);
  res.status(httpStatus.OK).json(user);
});

const updateProfile = catchAsync(async (req, res) => {
  const user = await userService.updateUser(req.user.id, req.body);
  res.status(httpStatus.OK).json(user);
});

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
};
