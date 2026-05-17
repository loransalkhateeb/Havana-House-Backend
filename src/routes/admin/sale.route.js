const express = require("express");
const validate = require("../../middlewares/validate");
const saleController = require("../../modules/sale/sale.controller");
const saleValidation = require("../../modules/sale/sale.validation");
const { auth } = require("../../middlewares/auth");
const { authorization } = require("../../middlewares/authorization");

const router = express.Router();

router.post(
  "/",
  auth(),
  authorization("admin"),
  validate(saleValidation.createSale),
  saleController.createSale,
);

router.get(
  "/",
  auth(),
  authorization("admin"),
  saleController.getSales,
);

router.post(
  "/report",
  auth(),
  authorization("admin"),
  validate(saleValidation.saleReport),
  saleController.getSaleReport,
);

router.get(
  "/:id",
  auth(),
  authorization("admin"),
  validate(saleValidation.getSale),
  saleController.getSaleById,
);

router.delete(
  "/:id",
  auth(),
  authorization("admin"),
  validate(saleValidation.deleteSale),
  saleController.deleteSale,
);

module.exports = router;
