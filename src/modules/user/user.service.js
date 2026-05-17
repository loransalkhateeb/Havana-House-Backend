const bcrypt = require("bcryptjs");
const httpStatus = require("http-status");
const prisma = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const createUser = async (body) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: body.email },
  });
  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }

  const hashedPassword = await bcrypt.hash(body.password, 10);

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: hashedPassword,
      roleId: body.roleId,
    },
    include: { role: true },
  });

  const { password, ...result } = user;
  return result;
};

const getUsers = async () => {
  const users = await prisma.user.findMany({
    include: { role: true },
  });
  return users.map(({ password, ...user }) => user);
};

const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  const { password, ...result } = user;
  return result;
};

const updateUser = async (id, body) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (body.email && body.email !== user.email) {
    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
    }
  }

  const data = { ...body };
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    include: { role: true },
  });

  const { password, ...result } = updated;
  return result;
};

const deleteUser = async (id) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  await prisma.user.delete({ where: { id } });
};

module.exports = { createUser, getUsers, getUserById, updateUser, deleteUser };
