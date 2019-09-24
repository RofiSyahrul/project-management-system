const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/check-auth");
const auth = require("../middlewares/auth");

module.exports = pool => {
  /* GET login page. */
  router.get("/", checkAuth, (req, res) => {
    res.redirect(`/projects`);
  });

  router.post("/:link/auth", auth(pool));

  router.post("/auth", auth(pool));

  router.get("/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/");
    });
  });

  return router;
};
