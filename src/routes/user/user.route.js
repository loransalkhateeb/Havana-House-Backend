const express = require("express");
const validate = require("../../middlewares/validate");
const userController = require("../../modules/user/user.controller");
const userValidation = require("../../modules/user/user.validation");
const { auth } = require("../../middlewares/auth");
const { authorization } = require("../../middlewares/authorization");

const router = express.Router();

router.get(
  "/profile",
  auth(),
  authorization("user", "admin"),
  userController.getProfile,
);

router.put(
  "/profile",
  auth(),
  authorization("user", "admin"),
  validate(userValidation.updateProfile),
  userController.updateProfile,
);

module.exports = router;
