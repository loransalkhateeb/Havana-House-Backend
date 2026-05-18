const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const inventoryService = require("./inventory.service");

const getInventoryOverview = catchAsync(async (req, res) => {
  const result = await inventoryService.getInventoryOverview();
  res.status(httpStatus.OK).json(result);
});

const getLowStock = catchAsync(async (req, res) => {
  const result = await inventoryService.getLowStock();
  res.status(httpStatus.OK).json(result);
});

const getMovements = catchAsync(async (req, res) => {
  const result = await inventoryService.getMovements(req.body);
  res.status(httpStatus.OK).json(result);
});

const getProductMovements = catchAsync(async (req, res) => {
  const result = await inventoryService.getProductMovements(req.body.productId);
  res.status(httpStatus.OK).json(result);
});

module.exports = { getInventoryOverview, getLowStock, getMovements, getProductMovements };
