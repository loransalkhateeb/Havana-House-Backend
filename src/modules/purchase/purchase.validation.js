const Joi = require("joi");

const createPurchase = {
  body: Joi.object().keys({
    supplierId: Joi.string().allow(null, ""),
    invoiceNumber: Joi.string().required().max(50),
    purchaseDate: Joi.date().iso(),
    items: Joi.array()
      .items(
        Joi.object().keys({
          productId: Joi.string().required(),
          quantity: Joi.number().integer().min(1).required(),
          purchasePrice: Joi.number().precision(2).min(0).required(),
        })
      )
      .min(1)
      .required(),
  }),
};

const getPurchase = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const deletePurchase = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const purchaseReport = {
  body: Joi.object().keys({
    period: Joi.string().valid("daily", "weekly", "monthly").default("daily"),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    supplierId: Joi.string(),
  }),
};

module.exports = { createPurchase, getPurchase, deletePurchase, purchaseReport };
