const express = require("express");
const validate = require("../middlewares/validate");
const authValidation = require("../modules/auth/auth.validation");
const authController = require("../modules/auth/auth.controller");
const adminRoutes = require("./admin");
const userRoutes = require("./user");

const router = express.Router();

router.post("/auth/register", validate(authValidation.register), authController.register);
router.post("/auth/login", validate(authValidation.login), authController.login);
router.post("/auth/refresh-token", validate(authValidation.refreshTokens), authController.refreshTokens);
router.post("/auth/logout", validate(authValidation.logout), authController.logout);

const routes = [
  { path: "/admin", route: adminRoutes },
  { path: "/user", route: userRoutes },
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;