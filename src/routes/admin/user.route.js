const express = require("express");
const validate = require("../../middlewares/validate");
const userController = require("../../modules/user/user.controller");
const userValidation = require("../../modules/user/user.validation");
const { auth } = require("../../middlewares/auth");
const { authorization } = require("../../middlewares/authorization");

const router = express.Router();

router.post(
  "/",
  auth(),
  authorization("admin"),
  validate(userValidation.createUser),
  userController.createUser,
);

router.get(
  "/",
  auth(),
  authorization("admin"),
  userController.getUsers,
);

router.get(
  "/cashiers",
  auth(),
  authorization("admin"),
  userController.getCashiers,
);

router.get(
  "/:id",
  auth(),
  authorization("admin"),
  validate(userValidation.getUser),
  userController.getUserById,
);

router.post(
  "/sales",
  auth(),
  authorization("admin"),
  validate(userValidation.getUserSales),
  userController.getUserSales,
);

router.put(
  "/:id",
  auth(),
  authorization("admin"),
  validate(userValidation.updateUser),
  userController.updateUser,
);

router.delete(
  "/:id",
  auth(),
  authorization("admin"),
  validate(userValidation.deleteUser),
  userController.deleteUser,
);

module.exports = router;
