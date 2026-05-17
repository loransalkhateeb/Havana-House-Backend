const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const saleService = require("./sale.service");

const createSale = catchAsync(async (req, res) => {
  const result = await saleService.createSale(req.user.id, req.body);
  res.status(httpStatus.CREATED).json(result);
});

const getSales = catchAsync(async (req, res) => {
  const sales = await saleService.getSales();
  res.status(httpStatus.OK).json(sales);
});

const getSaleById = catchAsync(async (req, res) => {
  const sale = await saleService.getSaleById(req.params.id);
  res.status(httpStatus.OK).json(sale);
});

const deleteSale = catchAsync(async (req, res) => {
  await saleService.deleteSale(req.params.id);
  res.status(httpStatus.OK).json({ message: "The record deleted successfully" });
});

const getSaleReport = catchAsync(async (req, res) => {
  const report = await saleService.getSaleReport(req.body);
  res.status(httpStatus.OK).json(report);
});

const getMySales = catchAsync(async (req, res) => {
  const result = await saleService.getMySales(req.user.id);
  res.status(httpStatus.OK).json(result);
});

const getMySaleReport = catchAsync(async (req, res) => {
  const report = await saleService.getMySaleReport(req.user.id, req.body);
  res.status(httpStatus.OK).json(report);
});

module.exports = { createSale, getSales, getSaleById, getMySales, getMySaleReport, deleteSale, getSaleReport };
