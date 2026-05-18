const express = require("express");
const validate = require("../../middlewares/validate");
const categoryController = require("../../modules/category/category.controller");
const categoryValidation = require("../../modules/category/category.validation");
const { auth } = require("../../middlewares/auth");
const { authorization } = require("../../middlewares/authorization");

const router = express.Router();

router.get(
  "/",
  auth(),
  authorization("user"),
  categoryController.getCategories,
);

router.get(
  "/:id",
  auth(),
  authorization("user"),
  validate(categoryValidation.getCategory),
  categoryController.getCategoryById,
);

module.exports = router;
