const httpStatus = require("http-status");
const prisma = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const createPurchase = async (userId, body) => {
  if (body.supplierId) {
    const supplier = await prisma.supplier.findUnique({ where: { id: body.supplierId } });
    if (!supplier) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Supplier not found");
    }
  }

  const existingInvoice = await prisma.purchase.findUnique({ where: { invoiceNumber: body.invoiceNumber } });
  if (existingInvoice) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invoice number already exists");
  }

  const productIds = body.items.map((item) => item.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  if (products.length !== productIds.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, "One or more products not found");
  }

  const purchaseItems = body.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    purchasePrice: item.purchasePrice,
    totalPrice: item.quantity * item.purchasePrice,
  }));

  const totalAmount = purchaseItems.reduce((sum, item) => sum + item.totalPrice, 0);

  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.create({
      data: {
        supplierId: body.supplierId || null,
        createdBy: userId,
        invoiceNumber: body.invoiceNumber,
        totalAmount,
        ...(body.purchaseDate ? { purchaseDate: new Date(body.purchaseDate) } : {}),
        purchaseItems: {
          create: purchaseItems,
        },
      },
      include: {
        supplier: true,
        user: { select: { id: true, name: true, email: true } },
        purchaseItems: { include: { product: true } },
      },
    });

    for (const item of body.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { increment: item.quantity } },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          createdBy: userId,
          type: "IN",
          quantity: item.quantity,
          referenceId: purchase.id,
          referenceType: "PURCHASE",
        },
      });
    }

    return purchase;
  });
};

const getPurchases = async () => {
  return prisma.purchase.findMany({
    include: {
      supplier: true,
      user: { select: { id: true, name: true, email: true } },
      purchaseItems: { include: { product: true } },
    },
    orderBy: { purchaseDate: "desc" },
  });
};

const getPurchaseById = async (id) => {
  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: {
      supplier: true,
      user: { select: { id: true, name: true, email: true } },
      purchaseItems: { include: { product: true } },
    },
  });
  if (!purchase) {
    throw new ApiError(httpStatus.NOT_FOUND, "Purchase not found");
  }
  return purchase;
};

const deletePurchase = async (id) => {
  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: { purchaseItems: true },
  });
  if (!purchase) {
    throw new ApiError(httpStatus.NOT_FOUND, "Purchase not found");
  }

  return prisma.$transaction(async (tx) => {
    for (const item of purchase.purchaseItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });

      await tx.inventoryMovement.deleteMany({
        where: { referenceId: purchase.id, referenceType: "PURCHASE" },
      });
    }

    await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });
    await tx.purchase.delete({ where: { id } });
  });
};

const getPurchaseReport = async (query = {}) => {
  const now = new Date();
  let startDate;
  let endDate;

  if (query.startDate && query.endDate) {
    startDate = new Date(query.startDate);
    endDate = new Date(query.endDate);
    endDate.setHours(23, 59, 59, 999);
  } else {
    switch (query.period) {
      case "weekly":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
    }
  }

  const where = {
    purchaseDate: { gte: startDate, lte: endDate },
  };

  if (query.supplierId) {
    where.supplierId = query.supplierId;
  }

  const purchases = await prisma.purchase.findMany({
    where,
    include: {
      supplier: true,
      user: { select: { id: true, name: true, email: true } },
      purchaseItems: { include: { product: true } },
    },
    orderBy: { purchaseDate: "desc" },
  });

  const totalPurchases = purchases.length;
  const totalAmount = purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);
  const totalItems = purchases.reduce(
    (sum, p) => sum + p.purchaseItems.reduce((s, item) => s + item.quantity, 0),
    0
  );

  const supplierBreakdown = {};
  for (const purchase of purchases) {
    const supplierName = purchase.supplier ? purchase.supplier.name || "Unknown" : "No Supplier";
    if (!supplierBreakdown[supplierName]) {
      supplierBreakdown[supplierName] = { purchases: 0, totalAmount: 0 };
    }
    supplierBreakdown[supplierName].purchases += 1;
    supplierBreakdown[supplierName].totalAmount += Number(purchase.totalAmount);
  }

  const productBreakdown = {};
  for (const purchase of purchases) {
    for (const item of purchase.purchaseItems) {
      const productName = item.product.name;
      if (!productBreakdown[productName]) {
        productBreakdown[productName] = { quantity: 0, totalSpent: 0 };
      }
      productBreakdown[productName].quantity += item.quantity;
      productBreakdown[productName].totalSpent += Number(item.totalPrice);
    }
  }

  const dailyBreakdown = {};
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  for (const purchase of purchases) {
    const date = new Date(purchase.purchaseDate);
    const dateKey = date.toISOString().split("T")[0];
    const dayName = dayNames[date.getDay()];

    if (!dailyBreakdown[dateKey]) {
      dailyBreakdown[dateKey] = {
        date: dateKey,
        day: dayName,
        totalPurchases: 0,
        totalAmount: 0,
        totalItems: 0,
      };
    }

    dailyBreakdown[dateKey].totalPurchases += 1;
    dailyBreakdown[dateKey].totalAmount += Number(purchase.totalAmount);
    dailyBreakdown[dateKey].totalItems += purchase.purchaseItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  }

  const dailySummary = Object.values(dailyBreakdown).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const weeklySummary = [];
  if ((query.period || "daily") === "monthly" || query.startDate) {
    const weeklyBreakdown = {};

    for (const purchase of purchases) {
      const date = new Date(purchase.purchaseDate);
      const day = date.getDate();
      const weekNumber = Math.ceil(day / 7);
      const weekStart = new Date(date.getFullYear(), date.getMonth(), (weekNumber - 1) * 7 + 1);
      const weekEndDay = Math.min(weekNumber * 7, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate());
      const weekEnd = new Date(date.getFullYear(), date.getMonth(), weekEndDay);

      const key = `week-${weekNumber}`;
      if (!weeklyBreakdown[key]) {
        weeklyBreakdown[key] = {
          week: weekNumber,
          startDate: weekStart.toISOString().split("T")[0],
          endDate: weekEnd.toISOString().split("T")[0],
          totalPurchases: 0,
          totalAmount: 0,
          totalItems: 0,
        };
      }

      weeklyBreakdown[key].totalPurchases += 1;
      weeklyBreakdown[key].totalAmount += Number(purchase.totalAmount);
      weeklyBreakdown[key].totalItems += purchase.purchaseItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
    }

    weeklySummary.push(...Object.values(weeklyBreakdown).sort((a, b) => a.week - b.week));
  }

  const detailedPurchases = purchases.map((purchase) => {
    const itemsCount = purchase.purchaseItems.length;
    const totalQuantity = purchase.purchaseItems.reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: purchase.id,
      invoiceNumber: purchase.invoiceNumber,
      purchaseDate: purchase.purchaseDate,
      totalAmount: Number(purchase.totalAmount),
      supplier: purchase.supplier
        ? { id: purchase.supplier.id, name: purchase.supplier.name }
        : null,
      createdBy: purchase.user,
      itemsCount,
      totalQuantity,
      items: purchase.purchaseItems.map((item) => ({
        id: item.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          barcode: item.product.barcode,
        },
        quantity: item.quantity,
        purchasePrice: Number(item.purchasePrice),
        totalPrice: Number(item.totalPrice),
      })),
    };
  });

  return {
    period: query.startDate ? "custom" : query.period || "daily",
    startDate,
    endDate,
    summary: {
      totalPurchases,
      totalAmount,
      totalItems,
    },
    dailySummary,
    weeklySummary,
    supplierBreakdown,
    productBreakdown,
    purchases: detailedPurchases,
  };
};

module.exports = { createPurchase, getPurchases, getPurchaseById, deletePurchase, getPurchaseReport };
