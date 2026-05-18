const Joi = require("joi");

const createUser = {
  body: Joi.object().keys({
    name: Joi.string().required().max(100),
    email: Joi.string().required().email().max(100),
    password: Joi.string().required().min(6).max(128),
    roleId: Joi.string().required(),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().max(100),
      email: Joi.string().email().max(100),
      password: Joi.string().min(6).max(128),
      roleId: Joi.string(),
      isActive: Joi.boolean(),
    })
    .min(1),
};

const getUser = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const deleteUser = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const updateProfile = {
  body: Joi.object()
    .keys({
      name: Joi.string().max(100),
      email: Joi.string().email().max(100),
      password: Joi.string().min(6).max(128),
    })
    .min(1),
};

const getUserSales = {
  body: Joi.object().keys({
    userId: Joi.string().required(),
  }),
};

module.exports = { createUser, updateUser, getUser, deleteUser, updateProfile, getUserSales };
