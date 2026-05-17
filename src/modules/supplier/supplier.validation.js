const Joi = require("joi");

const createSupplier = {
  body: Joi.object().keys({
    name: Joi.string().max(100).allow(null, ""),
    phone: Joi.string().max(20).allow(null, ""),
    address: Joi.string().max(255).allow(null, ""),
  }),
};

const updateSupplier = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().max(100).allow(null, ""),
      phone: Joi.string().max(20).allow(null, ""),
      address: Joi.string().max(255).allow(null, ""),
    })
    .min(1),
};

const getSupplier = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const deleteSupplier = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

module.exports = { createSupplier, updateSupplier, getSupplier, deleteSupplier };
