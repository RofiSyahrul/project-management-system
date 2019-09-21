const User = require("../models/user");
module.exports = pool => {
  return (req, res, next) => {
    const { email, password } = req.body;
    const user = new User(pool, email);
    user.find().then(result => {
      if (result.rows.length > 0) {
        // email found
        const pwd = result.rows[0].password;
        if (password == pwd) {
          // password correct
          req.session.user = result.rows[0];
          if (req.params.link){
            res.redirect(`/${req.params.link}/${req.session.user.userid}`);
          }else{
            res.redirect(`/projects/${req.session.user.userid}`)
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
