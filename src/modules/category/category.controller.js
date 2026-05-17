const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const categoryService = require("./category.service");

const createCategory = catchAsync(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  res.status(httpStatus.CREATED).json(category);
});

const getCategories = catchAsync(async (req, res) => {
  const categories = await categoryService.getCategories();
  res.status(httpStatus.OK).json(categories);
});

const getCategoryById = catchAsync(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);
  res.status(httpStatus.OK).json(category);
});

const updateCategory = catchAsync(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  res.status(httpStatus.OK).json(category);
});

const deleteCategory = catchAsync(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  res.status(httpStatus.OK).json({ message: "The record deleted successfully" });
});

module.exports = { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory };
