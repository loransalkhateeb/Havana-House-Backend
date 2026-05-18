const express = require("express");
const userRoute = require("./user.route");
const saleRoute = require("./sale.route");
const categoryRoute = require("./category.route");
const productRoute = require("./product.route");

const router = express.Router();

const routes = [
  { path: "/users", route: userRoute },
  { path: "/sales", route: saleRoute },
  { path: "/categories", route: categoryRoute },
  { path: "/products", route: productRoute },
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
