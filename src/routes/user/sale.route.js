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
  authorization("user"),
  validate(saleValidation.createSale),
  saleController.createSale,
);

router.post(
  "/my-transactions",
  auth(),
  authorization("user"),
  saleController.getMySales,
);

router.post(
  "/report",
  auth(),
  authorization("user"),
  validate(saleValidation.saleReport),
  saleController.getMySaleReport,
);

router.get(
  "/:id",
  auth(),
  authorization("user"),
  validate(saleValidation.getSale),
  saleController.getSaleById,
);

module.exports = router;
