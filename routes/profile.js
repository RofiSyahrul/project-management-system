const express = require("express");
const router = express.Router();
const checkAuth = require("../controller/functions").checkAuth;
const User = require("../models/user");

module.exports = (pool, limit = 2) => {
  // get profile page
  router.get("/:userid", checkAuth, (req, res) => {
    const user = req.session.user;
    let forms = [
      { name: "firstname", label: "First name", type: "text", maxlength: 50 },
      { name: "lastname", label: "Last name", type: "text", maxlength: 50 },
      { name: "email", label: "Email", type: "text", maxlength: 30 },
      { name: "password", label: "Password", type: "password", maxlength: 30 },
      {
        name: "position",
        label: "Position",
        type: "radio",
        options: ["Manager", "Software Developer", "Quality Assurance"]
      },
      {
        name: "fulltime",
        label: "Type",
        type: "checkbox",
        options: ["Fulltime"]
      }
    ];
    forms = forms.map(form => Object.assign({ value: user[form.name] }, form));
    forms[3].value = "";
    res.render("profile", {
      title: `${user.firstname} ${user.lastname} | Profile`,
      path: "/profile",
      userid: user.userid,
      admin: user.admin,
      notifAlert: req.flash("notif")[0],
      forms
    });
  });

  router.post("/:userid", checkAuth, (req, res) => {
    const user = req.session.user;
    const keys = ["password", "firstname", "lastname", "position", "fulltime"];
    const labels = [
      "password",
      "first name",
      "last name",
      "position",
      "job type"
    ];
    const profile = keys.map(key => user[key]);

    let { password, firstname, lastname, position, fulltime } = req.body;
    fulltime = fulltime === "Fulltime";
    password = password.trim().length > 0 ? password : user.password;
    firstname = firstname.trim().length > 0 ? firstname.trim() : user.firstname;
    lastname = lastname.trim().length > 0 ? lastname.trim() : user.lastname;

    const newProfile = [password, firstname, lastname, position, fulltime];
    const userid = parseInt(req.params.userid);

    // update users table
    User.editProfile(pool, newProfile, userid)
      .then(() => {
        // filter edited profile
        let edited = profile
          .filter((val, i) => val !== newProfile[i])
          .map(val => profile.indexOf(val));
        edited = edited.map(x => labels[x]);
        if (edited.length > 0) {
          const n = edited.length;
          const update =
            n == 1
              ? edited[0]
              : `${edited.slice(0, n - 1).join(", ")} and ${edited[n - 1]}`;

          req.flash("notif", `<b>Success!</b> Successfully updated ${update}`);
          User.findById(pool, userid)
            .then(result => {
              req.session.user = result.rows[0];
              res.redirect(`/profile/${userid}`);
            })
            .catch(e => res.render("error", { message: "Error", error: e }));
        } else {
          req.flash("notif", "Nothing updated");
          res.redirect(`/profile/${userid}`);
        }
      })
      .catch(e => res.render("error", { message: "Error", error: e }));
  });

  return router;
};
