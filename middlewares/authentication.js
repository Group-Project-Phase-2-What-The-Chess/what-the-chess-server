const { User } = require("../models");
const { verifyToken } = require("../helpers/jwt");

module.exports = async function authenthication(req, res, next) {
  const bearerToken = req.headers.authorization;
  if (!bearerToken) {
    return next({ name: "Unauthorized", message: "Token is required" });
  }
  const [, token] = bearerToken.split(" ");
  if (!token) {
    return next({ name: "Unauthorized", message: "Invalid token format" });
  }
  try {
    const data = verifyToken(token);
    const user = await User.findByPk(data.id);
    if (!user) {
      return next({ name: "Unauthorized", message: "User not found" });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next({ name: "Unauthorized", message: "Token has expired" });
    }
    next(error);
  }
};
