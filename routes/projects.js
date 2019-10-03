const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/check-auth");
const checkAccess = require("../middlewares/check-access");
const Project = require("../controllers/project-crud");
const getOverview = require("../controllers/project-overview");
const Member = require("../controllers/project-members");
const Issue = require("../controllers/project-issues");
const Activity = require("../controllers/project-activity");

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

  router.get(
    "/issues/:projectId",
    checkAuth,
    checkAccess(pool),
    Issue.getList(pool, limit)
  );

  router.post("/issues/:projectId", checkAuth, Issue.applyOptions(pool));

  router.get(
    "/issues/:projectId/add",
    checkAuth,
    checkAccess(pool),
    Issue.add(pool)
  );

  router.post("/issues/:projectId/add", checkAuth, Issue.save(pool, limit));

  router.get(
    "/issues/:projectId/edit/:issueId",
    checkAuth,
    checkAccess(pool),
    Issue.edit(pool)
  );

  router.post(
    "/issues/:projectId/edit/:issueId",
    checkAuth,
    Issue.update(pool, limit)
  );

  router.get(
    "/issues/:projectId/delete/:issueId",
    checkAuth,
    checkAccess(pool),
    Issue.del(pool, limit)
  );

  router.get(
    "/activity/:projectId",
    checkAuth,
    checkAccess(pool),
    Activity.view(pool, limit)
  );

  return router;
};
