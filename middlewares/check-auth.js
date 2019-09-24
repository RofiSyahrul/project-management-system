module.exports = (req,res,next) => {
  console.log(req.originalUrl);
  
  if (req.session.user)  next();
  else res.render('login', {loginAlert: req.flash('loginAlert')[0]});
}