const Joi = require("joi");

const productItem = Joi.object().keys({
  categoryId: Joi.string().required(),
  name: Joi.string().required().max(100),
  barcode: Joi.string().max(50).allow(null, ""),
  purchasePrice: Joi.number().precision(2).required(),
  salePrice: Joi.number().precision(2).required(),
  quantity: Joi.number().integer().default(0),
  minQuantity: Joi.number().integer().default(0),
});

const createProduct = {
  body: Joi.alternatives().try(
    productItem,
    Joi.array().items(productItem).min(1),
  ),
};

const updateProduct = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      categoryId: Joi.string(),
      name: Joi.string().max(100),
      barcode: Joi.string().max(50).allow(null, ""),
      purchasePrice: Joi.number().precision(2),
      salePrice: Joi.number().precision(2),
      quantity: Joi.number().integer(),
      minQuantity: Joi.number().integer(),
    })
    .min(1),
};

const getProduct = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const deleteProduct = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

module.exports = { createProduct, updateProduct, getProduct, deleteProduct };
