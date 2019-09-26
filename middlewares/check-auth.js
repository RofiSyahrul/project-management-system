module.exports = (req, res, next) => {
  if (req.session.user) next();
  else {
    req.session.url = req.originalUrl;
    res.redirect("/");
  }
};
