const User = require("../models/user");
module.exports = pool => {
  return (req, res, next) => {
    console.log(req.originalUrl);

    const { email, password } = req.body;
    const user = new User(pool, email);
    user.find().then(result => {
      if (result.rows.length > 0) {
        // email found
        const pwd = result.rows[0].password;
        if (password == pwd) {
          // password correct
          req.session.user = result.rows[0];
          let nickname = req.session.user.nickname;
          if (nickname == null || nickname == undefined || nickname == "") {
            nickname = `${req.session.user.firstname} ${req.session.user.lastname}`;
          }
          req.session.user.nickname = nickname;
          if (req.params.link) {
            res.redirect(`/${req.params.link}`);
          } else {
            res.redirect(`/projects`);
          }
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
  };
};
