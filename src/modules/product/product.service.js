const httpStatus = require("http-status");
const prisma = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const createProduct = async (body) => {
  const items = Array.isArray(body) ? body : [body];

  const categoryIds = [...new Set(items.map((item) => item.categoryId))];
  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
  if (categories.length !== categoryIds.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, "One or more categories not found");
  }

  const barcodes = items.map((item) => item.barcode).filter(Boolean);
  if (barcodes.length > 0) {
    const uniqueBarcodes = new Set(barcodes);
    if (uniqueBarcodes.size !== barcodes.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Duplicate barcodes in request");
    }
    const existing = await prisma.product.findMany({ where: { barcode: { in: barcodes } } });
    if (existing.length > 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Barcode already exists: ${existing.map((p) => p.barcode).join(", ")}`);
    }
  }

  return prisma.$transaction(async (tx) => {
    const products = [];
    for (const item of items) {
      const product = await tx.product.create({
        data: item,
        include: { category: true },
      });
      products.push(product);
    }
    return products.length === 1 ? products[0] : products;
  });
};

const getProducts = async () => {
  return prisma.product.findMany({
    where: { deletedAt: null },
    include: { category: true },
  });
};

const getProductById = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!product || product.deletedAt) {
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
  }
  return product;
};

const updateProduct = async (id, body) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.deletedAt) {
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
  }

  if (body.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: body.categoryId } });
    if (!category) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Category not found");
    }
  }

  if (body.barcode && body.barcode !== product.barcode) {
    const existing = await prisma.product.findUnique({ where: { barcode: body.barcode } });
    if (existing) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Barcode already exists");
    }
  }

  return prisma.product.update({
    where: { id },
    data: body,
    include: { category: true },
  });
};

const deleteProduct = async (id) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.deletedAt) {
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
  }
  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct };
