const express = require("express");
const validate = require("../../middlewares/validate");
const categoryController = require("../../modules/category/category.controller");
const categoryValidation = require("../../modules/category/category.validation");
const { auth } = require("../../middlewares/auth");
const { authorization } = require("../../middlewares/authorization");

const router = express.Router();

router.post(
  "/",
  auth(),
  authorization("admin"),
  validate(categoryValidation.createCategory),
  categoryController.createCategory,
);

router.get(
  "/",
  auth(),
  authorization("admin"),
  categoryController.getCategories,
);

router.get(
  "/:id",
  auth(),
  authorization("admin"),
  validate(categoryValidation.getCategory),
  categoryController.getCategoryById,
);

router.put(
  "/:id",
  auth(),
  authorization("admin"),
  validate(categoryValidation.updateCategory),
  categoryController.updateCategory,
);

router.delete(
  "/:id",
  auth(),
  authorization("admin"),
  validate(categoryValidation.deleteCategory),
  categoryController.deleteCategory,
);

module.exports = router;
