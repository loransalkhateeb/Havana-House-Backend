const Joi = require("joi");

const getMovements = {
  body: Joi.object().keys({
    type: Joi.string().valid("IN", "OUT"),
    referenceType: Joi.string().valid("PURCHASE", "SALE"),
  }),
};

const getProductMovements = {
  body: Joi.object().keys({
    productId: Joi.string().required(),
  }),
};

module.exports = { getMovements, getProductMovements };
