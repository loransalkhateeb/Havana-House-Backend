const express = require("express");
const userRoute = require("./user.route");
const supplierRoute = require("./supplier.route");
const categoryRoute = require("./category.route");
const productRoute = require("./product.route");
const purchaseRoute = require("./purchase.route");
const saleRoute = require("./sale.route");
const inventoryRoute = require("./inventory.route");

const router = express.Router();

const routes = [
  { path: "/users", route: userRoute },
  { path: "/suppliers", route: supplierRoute },
  { path: "/categories", route: categoryRoute },
  { path: "/products", route: productRoute },
  { path: "/purchases", route: purchaseRoute },
  { path: "/sales", route: saleRoute },
  { path: "/inventory", route: inventoryRoute },
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
