const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/check-auth");
const User = require("../models/user");

module.exports = pool => {
  // get profile page
  router.get("/:userid", checkAuth, (req, res) => {
    const user = req.session.user;
    let forms = [
      {
        name: "firstname",
        label: "First name",
        type: "text",
        maxlength: 50,
        ro: false
      },
      {
        name: "lastname",
        label: "Last name",
        type: "text",
        maxlength: 100,
        ro: false
      },
      { name: "email", label: "Email", type: "text", maxlength: 50, ro: true },
      {
        name: "password",
        label: "Password",
        type: "password",
        maxlength: 30,
        ro: false
      },
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
    forms[5].value = forms[5].value ? ["Fulltime"] : ["Parttime"];
    forms[4].optValues = forms[4].options;
    forms[5].optValues = forms[5].options;
    res.render("profile/view", {
      title: `${user.nickname} | Profile`,
      path: "/profile",
      projectPath: "",
      userid: user.userid,
      admin: user.admin,
      notifAlert: req.flash("notif")[0],
      forms,
      submit: "Update"
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

    // filter edited profile
    let edited = profile
      .filter((val, i) => val !== newProfile[i])
      .map(val => profile.indexOf(val));
    edited = edited.map(x => labels[x]);

    if (edited.length > 0) {
      // update users table
      User.editProfile(pool, newProfile, userid)
        .then(() => {
          const n = edited.length;
          const update =
            n == 1
              ? `${edited[0]} has`
              : `${edited.slice(0, n - 1).join(", ")} and ${
                  edited[n - 1]
                } have`;

          req.flash("notif", `<b>Success!</b> ${update} been updated`);
          User.findById(pool, userid)
            .then(result => {
              req.session.user = result.rows[0];
              res.redirect(`/profile/${userid}`);
            })
            .catch(e => res.render("error", { message: "Error", error: e }));
        })
        .catch(e => res.render("error", { message: "Error", error: e }));
    } else {
      req.flash("notif", "Nothing updated");
      res.redirect(`/profile/${userid}`);
    }
  });

  return router;
};
