const express = require("express");
const validate = require("../../middlewares/validate");
const purchaseController = require("../../modules/purchase/purchase.controller");
const purchaseValidation = require("../../modules/purchase/purchase.validation");
const { auth } = require("../../middlewares/auth");
const { authorization } = require("../../middlewares/authorization");

const router = express.Router();

router.post(
  "/",
  auth(),
  authorization("admin"),
  validate(purchaseValidation.createPurchase),
  purchaseController.createPurchase,
);

router.get(
  "/",
  auth(),
  authorization("admin"),
  purchaseController.getPurchases,
);

router.post(
  "/report",
  auth(),
  authorization("admin"),
  validate(purchaseValidation.purchaseReport),
  purchaseController.getPurchaseReport,
);

router.get(
  "/:id",
  auth(),
  authorization("admin"),
  validate(purchaseValidation.getPurchase),
  purchaseController.getPurchaseById,
);

router.delete(
  "/:id",
  auth(),
  authorization("admin"),
  validate(purchaseValidation.deletePurchase),
  purchaseController.deletePurchase,
);

module.exports = router;
