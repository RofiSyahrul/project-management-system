const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/check-auth");
const Profile = require("../controllers/profile-view");

module.exports = pool => {
  // get profile page
  router.get("/:userid", checkAuth, Profile.view());

  router.post("/:userid", checkAuth, Profile.update(pool));

  return router;
};
