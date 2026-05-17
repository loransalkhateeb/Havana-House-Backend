const httpStatus = require("http-status");
const prisma = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const createSupplier = async (body) => {
  return prisma.supplier.create({ data: body });
};

const getSuppliers = async () => {
  return prisma.supplier.findMany({
    include: { _count: { select: { purchases: true } } },
  });
};

const getSupplierById = async (id) => {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: { _count: { select: { purchases: true } } },
  });
  if (!supplier) {
    throw new ApiError(httpStatus.NOT_FOUND, "Supplier not found");
  }
  return supplier;
};

const updateSupplier = async (id, body) => {
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) {
    throw new ApiError(httpStatus.NOT_FOUND, "Supplier not found");
  }
  return prisma.supplier.update({ where: { id }, data: body });
};

const deleteSupplier = async (id) => {
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) {
    throw new ApiError(httpStatus.NOT_FOUND, "Supplier not found");
  }
  await prisma.supplier.delete({ where: { id } });
};

module.exports = { createSupplier, getSuppliers, getSupplierById, updateSupplier, deleteSupplier };
