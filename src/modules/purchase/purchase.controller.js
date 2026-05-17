const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const purchaseService = require("./purchase.service");

const createPurchase = catchAsync(async (req, res) => {
  const purchase = await purchaseService.createPurchase(req.user.id, req.body);
  res.status(httpStatus.CREATED).json(purchase);
});

const getPurchases = catchAsync(async (req, res) => {
  const purchases = await purchaseService.getPurchases();
  res.status(httpStatus.OK).json(purchases);
});

const getPurchaseById = catchAsync(async (req, res) => {
  const purchase = await purchaseService.getPurchaseById(req.params.id);
  res.status(httpStatus.OK).json(purchase);
});

const deletePurchase = catchAsync(async (req, res) => {
  await purchaseService.deletePurchase(req.params.id);
  res.status(httpStatus.OK).json({ message: "The record deleted successfully" });
});

const getPurchaseReport = catchAsync(async (req, res) => {
  const report = await purchaseService.getPurchaseReport(req.body);
  res.status(httpStatus.OK).json(report);
});

module.exports = { createPurchase, getPurchases, getPurchaseById, deletePurchase, getPurchaseReport };
