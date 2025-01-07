const bcrypt = require("bcryptjs");

const hashPassword = (password) => {
  return bcrypt.hashSync(password);
};

const comparePassword = (password, hashedPassword) => {
  return bcrypt.compareSync(password, hashedPassword);
};

module.exports = { hashPassword, comparePassword };
