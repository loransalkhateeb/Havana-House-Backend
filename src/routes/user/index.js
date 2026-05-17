const express = require("express");
const userRoute = require("./user.route");
const saleRoute = require("./sale.route");

const router = express.Router();

const routes = [
  { path: "/users", route: userRoute },
  { path: "/sales", route: saleRoute },
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
