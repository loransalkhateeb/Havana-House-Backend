const express = require("express");
const validate = require("../../middlewares/validate");
const productController = require("../../modules/product/product.controller");
const productValidation = require("../../modules/product/product.validation");
const { auth } = require("../../middlewares/auth");
const { authorization } = require("../../middlewares/authorization");

const router = express.Router();

router.post(
  "/",
  auth(),
  authorization("admin"),
  validate(productValidation.createProduct),
  productController.createProduct,
);

router.get(
  "/",
  auth(),
  authorization("admin"),
  productController.getProducts,
);

router.get(
  "/:id",
  auth(),
  authorization("admin"),
  validate(productValidation.getProduct),
  productController.getProductById,
);

router.put(
  "/:id",
  auth(),
  authorization("admin"),
  validate(productValidation.updateProduct),
  productController.updateProduct,
);

router.delete(
  "/:id",
  auth(),
  authorization("admin"),
  validate(productValidation.deleteProduct),
  productController.deleteProduct,
);

module.exports = router;
