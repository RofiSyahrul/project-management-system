const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/user");

const router = express.Router();

module.exports = pool => {
  /* GET login page. */
  router.get(
    "/",
    (req, res, next) => {
      if (req.session.user) res.redirect(`/projects`);
      else next();
    },
    (req, res) => {
      res.render("login", {
        loginAlert: req.flash("loginAlert")[0],
        latestUrl: req.session.url
      });
    }
  );

  router.post("/auth", (req, res) => {
    let { email, password, latestUrl } = req.body;
    latestUrl = latestUrl || "/projects";
    const user = new User(pool, email);
    user.find().then(result => {
      if (result.rows.length > 0) {
        // email found
        const pwd = result.rows[0].password;
        const isMatch = bcrypt.compareSync(password, pwd);
        if (isMatch) {
          // password correct
          req.session.user = result.rows[0];
          let nickname = req.session.user.nickname;
          if (nickname == null || nickname == undefined || nickname == "") {
            nickname = `${req.session.user.firstname} ${req.session.user.lastname}`;
          }
          req.session.user.nickname = nickname;
          res.redirect(latestUrl);
        } else {
          // password incorrect
          req.flash("loginAlert", "Email and password does not match");
          res.redirect("/");
        }
      } else {
        // email not found
        req.flash("loginAlert", "Email and password does not match");
        res.redirect("/");
      }
    });
  });

  router.get("/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/");
    });
  });

  return router;
};
