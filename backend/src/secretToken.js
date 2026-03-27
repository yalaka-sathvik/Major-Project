const jwt = require("jsonwebtoken");
const { loadEnv } = require("./utils/loadEnv");
loadEnv();

module.exports.createSecretToken = (id) => {
  return jwt.sign({ id }, process.env.TOKEN_KEY, {
    expiresIn: 3 * 24 * 60 * 60,
  });
};
