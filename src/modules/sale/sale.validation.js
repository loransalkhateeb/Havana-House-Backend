const Joi = require("joi");

const createSale = {
  body: Joi.object().keys({
    amountPaid: Joi.number().precision(2).min(0).required(),
    items: Joi.array()
      .items(
        Joi.object().keys({
          barcode: Joi.string().required(),
          quantity: Joi.number().integer().min(1).required(),
        })
      )
      .min(1)
      .required(),
  }),
};

const getSale = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const deleteSale = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const saleReport = {
  body: Joi.object().keys({
    period: Joi.string().valid("daily", "weekly", "monthly").default("daily"),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
};

module.exports = { createSale, getSale, deleteSale, saleReport };
