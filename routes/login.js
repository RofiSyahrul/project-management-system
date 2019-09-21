const express = require('express');
const router = express.Router();
const checkAuth = require('../controller/functions').checkAuth;
const auth = require('../controller/auth')

module.exports = (pool) => {
  /* GET login page. */
  router.get('/', checkAuth, (req, res) => {
    res.redirect(`/projects/${req.session.user.userid}`);
  });
  
  router.post('/:link/auth', auth(pool));

  router.post('/auth', auth(pool));

  router.get('/logout', (req,res) => {
    req.session.user = undefined;
    res.redirect('/');
  });

  return router;
}