const express = require("express");
const validate = require("../../middlewares/validate");
const inventoryController = require("../../modules/inventory/inventory.controller");
const inventoryValidation = require("../../modules/inventory/inventory.validation");
const { auth } = require("../../middlewares/auth");
const { authorization } = require("../../middlewares/authorization");

const router = express.Router();

router.get(
  "/",
  auth(),
  authorization("admin"),
  inventoryController.getInventoryOverview,
);

router.get(
  "/low-stock",
  auth(),
  authorization("admin"),
  inventoryController.getLowStock,
);

router.post(
  "/movements",
  auth(),
  authorization("admin"),
  validate(inventoryValidation.getMovements),
  inventoryController.getMovements,
);

router.post(
  "/product-movements",
  auth(),
  authorization("admin"),
  validate(inventoryValidation.getProductMovements),
  inventoryController.getProductMovements,
);

module.exports = router;
