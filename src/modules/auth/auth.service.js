const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const httpStatus = require("http-status");
const prisma = require("../../config/db");
const config = require("../../config");
const ApiError = require("../../utils/ApiError");

const register = async (body) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: body.email },
  });
  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }

  const role = await prisma.role.findUnique({ where: { id: body.roleId } });
  if (!role) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Role not found");
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

  const token = generateToken(user);

  return {
    user: excludePassword(user),
    token,
  };
};

const login = async (body) => {
  const user = await prisma.user.findUnique({
    where: { email: body.email },
    include: { role: true },
  });
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }

  if (!user.isActive) {
    throw new ApiError(httpStatus.FORBIDDEN, "Account is deactivated");
  }

  const isPasswordMatch = await bcrypt.compare(body.password, user.password);
  if (!isPasswordMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }

  const token = generateToken(user);

  return {
    user: excludePassword(user),
    token,
  };
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

const excludePassword = (user) => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

module.exports = { register, login };
