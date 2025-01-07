require("dotenv").config();
const express = require("express");

const app = express();

const router = require("./routers");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(router);

const port = 3000;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports = { app };
