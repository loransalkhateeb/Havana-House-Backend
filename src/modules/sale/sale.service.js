const httpStatus = require("http-status");
const prisma = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const generateInvoiceNumber = async () => {
  const today = new Date();
  const dateStr =
    today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, "0") +
    today.getDate().toString().padStart(2, "0");

  const prefix = `SALE-${dateStr}-`;

  const lastSale = await prisma.sale.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
  });

  let sequence = 1;
  if (lastSale) {
    const lastSequence = parseInt(lastSale.invoiceNumber.split("-").pop(), 10);
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
};

const createSale = async (userId, body) => {
  const barcodes = body.items.map((item) => item.barcode);

  const uniqueBarcodes = new Set(barcodes);
  if (uniqueBarcodes.size !== barcodes.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Duplicate barcodes in request");
  }

  const products = await prisma.product.findMany({
    where: { barcode: { in: barcodes } },
  });

  if (products.length !== barcodes.length) {
    const foundBarcodes = products.map((p) => p.barcode);
    const missing = barcodes.filter((b) => !foundBarcodes.includes(b));
    throw new ApiError(httpStatus.BAD_REQUEST, `Products not found for barcodes: ${missing.join(", ")}`);
  }

  const productMap = {};
  for (const product of products) {
    productMap[product.barcode] = product;
  }

  const saleItems = [];
  for (const item of body.items) {
    const product = productMap[item.barcode];

    if (product.quantity < item.quantity) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Insufficient stock for "${product.name}" (barcode: ${item.barcode}). Available: ${product.quantity}, Requested: ${item.quantity}`
      );
    }

    saleItems.push({
      productId: product.id,
      quantity: item.quantity,
      salePrice: Number(product.salePrice),
      totalPrice: item.quantity * Number(product.salePrice),
    });
  }

  const totalAmount = Math.round(saleItems.reduce((sum, item) => sum + item.totalPrice, 0) * 100) / 100;
  const amountPaid = Math.round(body.amountPaid * 100) / 100;

  if (amountPaid < totalAmount) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Insufficient payment. Total: ${totalAmount.toFixed(2)}, Paid: ${amountPaid.toFixed(2)}, Remaining: ${(totalAmount - amountPaid).toFixed(2)}`
    );
  }

  const change = Math.round((amountPaid - totalAmount) * 100) / 100;

  const invoiceNumber = await generateInvoiceNumber();

  const sale = await prisma.$transaction(async (tx) => {
    const createdSale = await tx.sale.create({
      data: {
        createdBy: userId,
        invoiceNumber,
        totalAmount,
        paymentMethod: "direct",
        saleItems: {
          create: saleItems,
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        saleItems: { include: { product: true } },
      },
    });

    for (const item of body.items) {
      const product = productMap[item.barcode];

      await tx.product.update({
        where: { id: product.id },
        data: { quantity: { decrement: item.quantity } },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          createdBy: userId,
          type: "OUT",
          quantity: item.quantity,
          referenceId: createdSale.id,
          referenceType: "SALE",
        },
      });
    }

    return createdSale;
  });

  return {
    invoice: {
      invoiceNumber: sale.invoiceNumber,
      saleDate: sale.saleDate,
      cashier: sale.user,
      items: sale.saleItems.map((item) => ({
        product: item.product.name,
        barcode: item.product.barcode,
        quantity: item.quantity,
        unitPrice: Number(item.salePrice),
        totalPrice: Number(item.totalPrice),
      })),
      totalItems: sale.saleItems.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: Number(sale.totalAmount),
      amountPaid,
      change,
    },
  };
};

const getSales = async () => {
  return prisma.sale.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      saleItems: { include: { product: true } },
    },
    orderBy: { saleDate: "desc" },
  });
};

const getSaleById = async (id) => {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      saleItems: { include: { product: true } },
    },
  });
  if (!sale) {
    throw new ApiError(httpStatus.NOT_FOUND, "Sale not found");
  }

  return {
    invoice: {
      id: sale.id,
      invoiceNumber: sale.invoiceNumber,
      saleDate: sale.saleDate,
      cashier: sale.user,
      items: sale.saleItems.map((item) => ({
        product: item.product.name,
        barcode: item.product.barcode,
        quantity: item.quantity,
        unitPrice: Number(item.salePrice),
        totalPrice: Number(item.totalPrice),
      })),
      totalItems: sale.saleItems.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: Number(sale.totalAmount),
    },
  };
};

const getMySales = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: { select: { name: true } } },
  });

  const sales = await prisma.sale.findMany({
    where: { createdBy: userId },
    include: {
      saleItems: { include: { product: true } },
    },
    orderBy: { saleDate: "desc" },
  });

  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const totalItemsSold = sales.reduce(
    (sum, s) => sum + s.saleItems.reduce((s2, item) => s2 + item.quantity, 0),
    0
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
    },
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
      itemsCount: sale.saleItems.length,
      totalQuantity: sale.saleItems.reduce((sum, item) => sum + item.quantity, 0),
      items: sale.saleItems.map((item) => ({
        product: {
          id: item.product.id,
          name: item.product.name,
          barcode: item.product.barcode,
        },
        quantity: item.quantity,
        unitPrice: Number(item.salePrice),
        totalPrice: Number(item.totalPrice),
      })),
    })),
  };
};

const deleteSale = async (id) => {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { saleItems: true },
  });
  if (!sale) {
    throw new ApiError(httpStatus.NOT_FOUND, "Sale not found");
  }

  return prisma.$transaction(async (tx) => {
    for (const item of sale.saleItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { increment: item.quantity } },
      });
    }

    await tx.inventoryMovement.deleteMany({
      where: { referenceId: sale.id, referenceType: "SALE" },
    });

    await tx.saleItem.deleteMany({ where: { saleId: id } });
    await tx.sale.delete({ where: { id } });
  });
};

const getSaleReport = async (query = {}) => {
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

  const sales = await prisma.sale.findMany({
    where: { saleDate: { gte: startDate, lte: endDate } },
    include: {
      user: { select: { id: true, name: true, email: true } },
      saleItems: { include: { product: true } },
    },
    orderBy: { saleDate: "desc" },
  });

  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const totalItemsSold = sales.reduce(
    (sum, s) => sum + s.saleItems.reduce((s2, item) => s2 + item.quantity, 0),
    0
  );

  const productBreakdown = {};
  for (const sale of sales) {
    for (const item of sale.saleItems) {
      const productName = item.product.name;
      if (!productBreakdown[productName]) {
        productBreakdown[productName] = { barcode: item.product.barcode, quantitySold: 0, totalRevenue: 0 };
      }
      productBreakdown[productName].quantitySold += item.quantity;
      productBreakdown[productName].totalRevenue += Number(item.totalPrice);
    }
  }

  const dailyBreakdown = {};
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  for (const sale of sales) {
    const date = new Date(sale.saleDate);
    const dateKey = date.toISOString().split("T")[0];
    if (!dailyBreakdown[dateKey]) {
      dailyBreakdown[dateKey] = {
        date: dateKey,
        day: dayNames[date.getDay()],
        totalSales: 0,
        totalRevenue: 0,
        totalItems: 0,
      };
    }
    dailyBreakdown[dateKey].totalSales += 1;
    dailyBreakdown[dateKey].totalRevenue += Number(sale.totalAmount);
    dailyBreakdown[dateKey].totalItems += sale.saleItems.reduce((s, item) => s + item.quantity, 0);
  }

  const dailySummary = Object.values(dailyBreakdown).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const weeklySummary = [];
  if ((query.period || "daily") === "monthly" || query.startDate) {
    const weeklyBreakdown = {};

    for (const sale of sales) {
      const date = new Date(sale.saleDate);
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
          totalSales: 0,
          totalRevenue: 0,
          totalItems: 0,
        };
      }

      weeklyBreakdown[key].totalSales += 1;
      weeklyBreakdown[key].totalRevenue += Number(sale.totalAmount);
      weeklyBreakdown[key].totalItems += sale.saleItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
    }

    weeklySummary.push(...Object.values(weeklyBreakdown).sort((a, b) => a.week - b.week));
  }

  const cashierBreakdown = {};
  for (const sale of sales) {
    const cashierName = sale.user.name;
    if (!cashierBreakdown[cashierName]) {
      cashierBreakdown[cashierName] = { id: sale.user.id, totalSales: 0, totalRevenue: 0, totalItems: 0 };
    }
    cashierBreakdown[cashierName].totalSales += 1;
    cashierBreakdown[cashierName].totalRevenue += Number(sale.totalAmount);
    cashierBreakdown[cashierName].totalItems += sale.saleItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  }

  const detailedSales = sales.map((sale) => ({
    id: sale.id,
    invoiceNumber: sale.invoiceNumber,
    saleDate: sale.saleDate,
    totalAmount: Number(sale.totalAmount),
    cashier: sale.user,
    itemsCount: sale.saleItems.length,
    totalQuantity: sale.saleItems.reduce((sum, item) => sum + item.quantity, 0),
    items: sale.saleItems.map((item) => ({
      product: {
        id: item.product.id,
        name: item.product.name,
        barcode: item.product.barcode,
      },
      quantity: item.quantity,
      unitPrice: Number(item.salePrice),
      totalPrice: Number(item.totalPrice),
    })),
  }));

  return {
    period: query.startDate ? "custom" : query.period || "daily",
    startDate,
    endDate,
    summary: {
      totalSales,
      totalRevenue,
      totalItemsSold,
    },
    dailySummary,
    weeklySummary,
    cashierBreakdown,
    productBreakdown,
    sales: detailedSales,
  };
};

const getMySaleReport = async (userId, query = {}) => {
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

  const sales = await prisma.sale.findMany({
    where: {
      createdBy: userId,
      saleDate: { gte: startDate, lte: endDate },
    },
    include: {
      saleItems: { include: { product: true } },
    },
    orderBy: { saleDate: "desc" },
  });

  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const totalItemsSold = sales.reduce(
    (sum, s) => sum + s.saleItems.reduce((s2, item) => s2 + item.quantity, 0),
    0
  );

  const productBreakdown = {};
  for (const sale of sales) {
    for (const item of sale.saleItems) {
      const productName = item.product.name;
      if (!productBreakdown[productName]) {
        productBreakdown[productName] = { barcode: item.product.barcode, quantitySold: 0, totalRevenue: 0 };
      }
      productBreakdown[productName].quantitySold += item.quantity;
      productBreakdown[productName].totalRevenue += Number(item.totalPrice);
    }
  }

  const dailyBreakdown = {};
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  for (const sale of sales) {
    const date = new Date(sale.saleDate);
    const dateKey = date.toISOString().split("T")[0];
    if (!dailyBreakdown[dateKey]) {
      dailyBreakdown[dateKey] = {
        date: dateKey,
        day: dayNames[date.getDay()],
        totalSales: 0,
        totalRevenue: 0,
        totalItems: 0,
      };
    }
    dailyBreakdown[dateKey].totalSales += 1;
    dailyBreakdown[dateKey].totalRevenue += Number(sale.totalAmount);
    dailyBreakdown[dateKey].totalItems += sale.saleItems.reduce((s, item) => s + item.quantity, 0);
  }

  const dailySummary = Object.values(dailyBreakdown).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const weeklySummary = [];
  if ((query.period || "daily") === "monthly" || query.startDate) {
    const weeklyBreakdown = {};
    for (const sale of sales) {
      const date = new Date(sale.saleDate);
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
          totalSales: 0,
          totalRevenue: 0,
          totalItems: 0,
        };
      }
      weeklyBreakdown[key].totalSales += 1;
      weeklyBreakdown[key].totalRevenue += Number(sale.totalAmount);
      weeklyBreakdown[key].totalItems += sale.saleItems.reduce((sum, item) => sum + item.quantity, 0);
    }
    weeklySummary.push(...Object.values(weeklyBreakdown).sort((a, b) => a.week - b.week));
  }

  const detailedSales = sales.map((sale) => ({
    id: sale.id,
    invoiceNumber: sale.invoiceNumber,
    saleDate: sale.saleDate,
    totalAmount: Number(sale.totalAmount),
    itemsCount: sale.saleItems.length,
    totalQuantity: sale.saleItems.reduce((sum, item) => sum + item.quantity, 0),
    items: sale.saleItems.map((item) => ({
      product: {
        id: item.product.id,
        name: item.product.name,
        barcode: item.product.barcode,
      },
      quantity: item.quantity,
      unitPrice: Number(item.salePrice),
      totalPrice: Number(item.totalPrice),
    })),
  }));

  return {
    period: query.startDate ? "custom" : query.period || "daily",
    startDate,
    endDate,
    summary: {
      totalSales,
      totalRevenue,
      totalItemsSold,
    },
    dailySummary,
    weeklySummary,
    productBreakdown,
    sales: detailedSales,
  };
};

module.exports = { createSale, getSales, getSaleById, getMySales, getMySaleReport, deleteSale, getSaleReport };
