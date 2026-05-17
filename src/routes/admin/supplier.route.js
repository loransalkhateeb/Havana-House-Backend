const express = require("express");
const validate = require("../../middlewares/validate");
const supplierController = require("../../modules/supplier/supplier.controller");
const supplierValidation = require("../../modules/supplier/supplier.validation");
const { auth } = require("../../middlewares/auth");
const { authorization } = require("../../middlewares/authorization");

const router = express.Router();

router.post(
  "/",
  auth(),
  authorization("admin"),
  validate(supplierValidation.createSupplier),
  supplierController.createSupplier,
);

router.get(
  "/",
  auth(),
  authorization("admin"),
  supplierController.getSuppliers,
);

router.get(
  "/:id",
  auth(),
  authorization("admin"),
  validate(supplierValidation.getSupplier),
  supplierController.getSupplierById,
);

router.put(
  "/:id",
  auth(),
  authorization("admin"),
  validate(supplierValidation.updateSupplier),
  supplierController.updateSupplier,
);

router.delete(
  "/:id",
  auth(),
  authorization("admin"),
  validate(supplierValidation.deleteSupplier),
  supplierController.deleteSupplier,
);

module.exports = router;
