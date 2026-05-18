const express = require("express");
const validate = require("../../middlewares/validate");
const productController = require("../../modules/product/product.controller");
const productValidation = require("../../modules/product/product.validation");
const { auth } = require("../../middlewares/auth");
const { authorization } = require("../../middlewares/authorization");

const router = express.Router();

router.get(
  "/",
  auth(),
  authorization("user"),
  productController.getProducts,
);

router.get(
  "/:id",
  auth(),
  authorization("user"),
  validate(productValidation.getProduct),
  productController.getProductById,
);

module.exports = router;
