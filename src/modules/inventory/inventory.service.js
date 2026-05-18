const httpStatus = require("http-status");
const prisma = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const getInventoryOverview = async () => {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { name: "asc" },
  });

  const totalProducts = products.length;
  const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalStockValue = products.reduce(
    (sum, p) => sum + p.quantity * Number(p.purchasePrice),
    0
  );
  const totalSaleValue = products.reduce(
    (sum, p) => sum + p.quantity * Number(p.salePrice),
    0
  );
  const lowStockProducts = products.filter((p) => p.quantity <= p.minQuantity);
  const outOfStockProducts = products.filter((p) => p.quantity === 0);

  return {
    summary: {
      totalProducts,
      totalQuantity,
      totalStockValue,
      totalSaleValue,
      expectedProfit: totalSaleValue - totalStockValue,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
    },
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      barcode: p.barcode,
      category: p.category.name,
      purchasePrice: Number(p.purchasePrice),
      salePrice: Number(p.salePrice),
      quantity: p.quantity,
      minQuantity: p.minQuantity,
      stockValue: p.quantity * Number(p.purchasePrice),
      status:
        p.quantity === 0
          ? "out_of_stock"
          : p.quantity <= p.minQuantity
            ? "low_stock"
            : "in_stock",
    })),
  };
};

const getLowStock = async () => {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { quantity: "asc" },
  });

  const filtered = products.filter((p) => p.quantity <= p.minQuantity);

  return filtered.map((p) => ({
    id: p.id,
    name: p.name,
    barcode: p.barcode,
    category: p.category.name,
    quantity: p.quantity,
    minQuantity: p.minQuantity,
    shortage: p.minQuantity - p.quantity,
    status: p.quantity === 0 ? "out_of_stock" : "low_stock",
  }));
};

const getMovements = async (query = {}) => {
  const where = {};

  if (query.type) {
    where.type = query.type;
  }

  if (query.referenceType) {
    where.referenceType = query.referenceType;
  }

  const movements = await prisma.inventoryMovement.findMany({
    where,
    include: {
      product: { select: { id: true, name: true, barcode: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return movements;
};

const getProductMovements = async (productId) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: true },
  });
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
  }

  const movements = await prisma.inventoryMovement.findMany({
    where: { productId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalIn = movements
    .filter((m) => m.type === "IN")
    .reduce((sum, m) => sum + m.quantity, 0);
  const totalOut = movements
    .filter((m) => m.type === "OUT")
    .reduce((sum, m) => sum + m.quantity, 0);

  return {
    product: {
      id: product.id,
      name: product.name,
      barcode: product.barcode,
      category: product.category.name,
      currentQuantity: product.quantity,
      minQuantity: product.minQuantity,
      purchasePrice: Number(product.purchasePrice),
      salePrice: Number(product.salePrice),
    },
    movementSummary: {
      totalIn,
      totalOut,
      totalMovements: movements.length,
    },
    movements: movements.map((m) => ({
      id: m.id,
      type: m.type,
      quantity: m.quantity,
      referenceType: m.referenceType,
      referenceId: m.referenceId,
      createdBy: m.user,
      createdAt: m.createdAt,
    })),
  };
};

module.exports = { getInventoryOverview, getLowStock, getMovements, getProductMovements };
