const Joi = require("joi");

const createCategory = {
  body: Joi.object().keys({
    name: Joi.string().required().max(100),
  }),
};

const updateCategory = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().max(100),
    })
    .min(1),
};

const getCategory = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const deleteCategory = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

module.exports = { createCategory, updateCategory, getCategory, deleteCategory };
