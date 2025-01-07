const express = require("express");
const Controller = require("../controllers/controller");
const authentication = require("../middlewares/authentication");
const authorization = require("../middlewares/authorization");

const router = express.Router();

router.get("/", (req, res) => res.json({ message: "Hello World DUnia!" }));

// register
// router.post("/register", Controller.register);

// // login
// router.post("/login", Controller.login);

// router.use(authentication);
// router.get("/courses", Controller.getCourses);
// router.get("/mycourses", Controller.getMyCourses);

// router.post("/mycourses/:courseId", Controller.AddCourse);

// router.patch("/mycourses/:id", authorization, Controller.updateStatus);

function errorHandler(err, req, res, next) {
  console.log("🚀 ~ errorHandler ~ err:", err);
  switch (err.name) {
    case "SequelizeValidationError":
    case "SequelizeUniqueConstraintError":
      return res.status(400).json({ message: err.errors[0].message });
    case "CustomValidation":
      return res.status(400).json({ message: err.message });
    case "BadRequest":
      return res.status(400).json({ message: err.message });
    case "Unauthorized":
      return res.status(401).json({ message: err.message ?? "Invalid token" });
    case "JsonWebTokenError":
      return res.status(401).json({ message: "Invalid token" });
    case "Forbidden":
      return res.status(403).json({ message: "You are not Authorized" });
    case "Not Found":
      return res.status(404).json({ message: err.message });
    default:
      res.status(500).json({ message: "Internal Server Error" });
  }
}

router.use(errorHandler);

module.exports = router;
