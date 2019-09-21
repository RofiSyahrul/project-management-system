const express = require('express');
const router = express.Router();
const checkAuth = require('../controller/functions').checkAuth;

module.exports = (pool,limit=2) => {
  // get home page of project
  router.get('/:userid', checkAuth, (req,res) => {
    res.render('projects', {
      title: `${req.session.user.firstname} ${req.session.user.lastname} - Projects`,
      path: '/projects',
      userid: req.session.user.userid,
      admin: req.session.user.admin
    });
  });
  return router
}