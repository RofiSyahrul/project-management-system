var express = require("express");
var router = express.Router();
const checkAuth = require("../middlewares/check-auth");
const checkAccess = require("../middlewares/check-access");
const User = require("../controllers/user-crud");

module.exports = (pool, limit = 2) => {
  router.get("/", checkAuth, checkAccess(pool), User.getList(pool, limit));

  return router;
};
