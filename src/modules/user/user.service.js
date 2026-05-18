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

const getCashiers = async () => {
  const users = await prisma.user.findMany({
    where: { role: { name: "user" } },
    include: { role: true },
  });
  return users.map(({ password, ...user }) => user);
};

const getUserSales = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const sales = await prisma.sale.findMany({
    where: { createdBy: userId },
    include: {
      saleItems: {
        include: {
          product: {
            include: { category: true },
          },
        },
      },
    },
    orderBy: { saleDate: "desc" },
  });

  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const totalItemsSold = sales.reduce(
    (sum, s) => sum + s.saleItems.reduce((s2, item) => s2 + item.quantity, 0),
    0
  );

  const { password, ...userInfo } = user;

  return {
    user: userInfo,
    summary: {
      totalSales,
      totalRevenue,
      totalItemsSold,
    },
    sales: sales.map((sale) => ({
      id: sale.id,
      invoiceNumber: sale.invoiceNumber,
      saleDate: sale.saleDate,
      totalAmount: Number(sale.totalAmount),
      paymentMethod: sale.paymentMethod,
      itemsCount: sale.saleItems.length,
      totalQuantity: sale.saleItems.reduce((sum, item) => sum + item.quantity, 0),
      items: sale.saleItems.map((item) => ({
        product: {
          id: item.product.id,
          name: item.product.name,
          barcode: item.product.barcode,
          category: item.product.category.name,
          currentPrice: Number(item.product.salePrice),
        },
        quantity: item.quantity,
        unitPrice: Number(item.salePrice),
        totalPrice: Number(item.totalPrice),
      })),
    })),
  };
};

module.exports = { createUser, getUsers, getUserById, updateUser, deleteUser, getCashiers, getUserSales };
