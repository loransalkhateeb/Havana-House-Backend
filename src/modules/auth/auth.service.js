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

  const tokens = await generateTokens(user);

  return {
    user: excludePassword(user),
    tokens,
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

  const tokens = await generateTokens(user);

  return {
    user: excludePassword(user),
    tokens,
  };
};

const refreshTokens = async (refreshToken) => {
  let payload;
  try {
    payload = jwt.verify(refreshToken, config.jwtRefreshSecret);
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    if (storedToken) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    }
    throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token expired");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    include: { role: true },
  });

  if (!user || !user.isActive) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not found or deactivated");
  }

  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  const tokens = await generateTokens(user);

  return { user: excludePassword(user), tokens };
};

const logout = async (refreshToken) => {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (storedToken) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
  }
};

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiresIn }
  );
};

const generateTokens = async (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const refreshExpiresMs = parseExpiry(config.jwtRefreshExpiresIn);
  const expiresAt = new Date(Date.now() + refreshExpiresMs);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    },
  });

  return {
    access: {
      token: accessToken,
      expiresIn: config.jwtExpiresIn,
    },
    refresh: {
      token: refreshToken,
      expiresIn: config.jwtRefreshExpiresIn,
    },
  };
};

const parseExpiry = (expiresIn) => {
  const match = expiresIn.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 30 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1]);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * multipliers[unit];
};

const excludePassword = (user) => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

module.exports = { register, login, refreshTokens, logout };
