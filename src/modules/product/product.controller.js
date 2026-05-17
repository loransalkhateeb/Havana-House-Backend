const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const productService = require("./product.service");

const createProduct = catchAsync(async (req, res) => {
  const product = await productService.createProduct(req.body);
  res.status(httpStatus.CREATED).json(product);
});

const getProducts = catchAsync(async (req, res) => {
  const products = await productService.getProducts();
  res.status(httpStatus.OK).json(products);
});

const getProductById = catchAsync(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  res.status(httpStatus.OK).json(product);
});

const updateProduct = catchAsync(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  res.status(httpStatus.OK).json(product);
});

const deleteProduct = catchAsync(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  res.status(httpStatus.OK).json({ message: "The record deleted successfully" });
});

module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct };
