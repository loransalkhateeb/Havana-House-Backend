const Joi = require("joi");

const register = {
  body: Joi.object().keys({
    name: Joi.string().required().max(100),
    email: Joi.string().required().email().max(100),
    password: Joi.string().required().min(6).max(128),
    roleId: Joi.string().required(),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
};

module.exports = { register, login };
