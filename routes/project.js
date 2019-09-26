const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/check-auth");
const checkAccess = require("../middlewares/check-access");
const Project = require("../controller/project-crud");
const getOverview = require("../controller/project-overview");
const Member = require("../controller/project-members");

module.exports = (pool, limit = 2) => {
  router.get("/", checkAuth, Project.getList(pool, limit));
  router.post("/", checkAuth, Project.applyOptions(pool));
  router.get("/add", checkAuth, checkAccess(pool), Project.add(pool));
  router.post("/add", checkAuth, Project.save(pool, limit));
  router.get(
    "/edit/:projectId",
    checkAuth,
    checkAccess(pool),
    Project.edit(pool)
  );
  router.post("/edit/:projectId", checkAuth, Project.update(pool, limit));

  router.get(
    "/delete/:projectId",
    checkAuth,
    checkAccess(pool),
    Project.del(pool, limit)
  );

  router.get(
    "/overview/:projectId",
    checkAuth,
    checkAccess(pool),
    getOverview(pool)
  );

  router.get(
    "/members/:projectId",
    checkAuth,
    checkAccess(pool),
    Member.getList(pool, limit)
  );

  router.post("/members/:projectId", checkAuth, Member.applyOptions(pool));

  router.get(
    "/members/:projectId/add",
    checkAuth,
    checkAccess(pool),
    Member.add(pool)
  );

  router.post("/members/:projectId/add", checkAuth, Member.save(pool, limit));

  router.get(
    "/members/:projectId/edit/:userId",
    checkAuth,
    checkAccess(pool),
    Member.edit(pool)
  );

  router.post(
    "/members/:projectId/edit/:userId",
    checkAuth,
    Member.update(pool, limit)
  );

  router.get(
    "/members/:projectId/delete/:userId",
    checkAuth,
    checkAccess(pool),
    Member.del(pool, limit)
  );
  
  return router;
};
