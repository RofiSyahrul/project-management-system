var express = require("express");
var router = express.Router();
const checkAuth = require("../middlewares/check-auth");
const checkAccess = require("../middlewares/check-access");
const User = require("../controllers/user-crud");

module.exports = (pool, limit = 2) => {
  router.get("/", checkAuth, checkAccess(pool), User.getList(pool, limit));
  router.post("/", checkAuth, User.applyOptions(pool));
  router.get("/add", checkAuth, checkAccess(pool), User.add());
  router.post("/add", checkAuth, User.save(pool, limit));
  router.get("/edit/:userId", checkAuth, checkAccess(pool), User.edit(pool));
  router.post("/edit/:userId", checkAuth, User.update(pool, limit));
  router.get(
    "/delete/:userId",
    checkAuth,
    checkAccess(pool),
    User.del(pool, limit)
  );
  return router;
};
