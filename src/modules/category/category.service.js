const httpStatus = require("http-status");
const prisma = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const createCategory = async (body) => {
  return prisma.category.create({ data: body });
};

const getCategories = async () => {
  return prisma.category.findMany({
    include: { _count: { select: { products: true } } },
  });
};

const getCategoryById = async (id) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }
  return category;
};

const updateCategory = async (id, body) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }
  return prisma.category.update({ where: { id }, data: body });
};

const deleteCategory = async (id) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }
  await prisma.category.delete({ where: { id } });
};

module.exports = { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory };
