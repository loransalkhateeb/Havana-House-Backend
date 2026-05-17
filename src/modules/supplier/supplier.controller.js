const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const supplierService = require("./supplier.service");

const createSupplier = catchAsync(async (req, res) => {
  const supplier = await supplierService.createSupplier(req.body);
  res.status(httpStatus.CREATED).json(supplier);
});

const getSuppliers = catchAsync(async (req, res) => {
  const suppliers = await supplierService.getSuppliers();
  res.status(httpStatus.OK).json(suppliers);
});

const getSupplierById = catchAsync(async (req, res) => {
  const supplier = await supplierService.getSupplierById(req.params.id);
  res.status(httpStatus.OK).json(supplier);
});

const updateSupplier = catchAsync(async (req, res) => {
  const supplier = await supplierService.updateSupplier(req.params.id, req.body);
  res.status(httpStatus.OK).json(supplier);
});

const deleteSupplier = catchAsync(async (req, res) => {
  await supplierService.deleteSupplier(req.params.id);
  res.status(httpStatus.OK).json({ message: "The record deleted successfully" });
});

module.exports = { createSupplier, getSuppliers, getSupplierById, updateSupplier, deleteSupplier };
