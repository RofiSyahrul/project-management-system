const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/check-auth");
const Project = require("../controller/project");

module.exports = (pool, limit = 2) => {
  router.get("/", checkAuth, Project.getList(pool, limit));
  router.post("/", checkAuth, Project.applyOptions(pool));
  router.get("/add", checkAuth, Project.add(pool));
  router.post("/add", checkAuth, Project.save(pool, limit));
  router.get("/edit/:projectId", checkAuth, Project.edit(pool));
  router.post("/edit/:projectId", checkAuth, Project.update(pool, limit));
  router.get('/delete/:projectId', checkAuth, Project.del(pool, limit));
  return router;
};
