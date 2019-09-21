const express = require("express");
const router = express.Router();
const checkAuth = require("../controller/functions").checkAuth;
const Project = require("../models/project");

module.exports = (pool, limit = 2) => {
  // get home page of project
  router.get("/:userid", checkAuth, (req, res) => {
    const userid = req.session.user.userid;
    const admin = req.session.user.admin;
    const current = Number(req.query.page || 1);
    let url = req.originalUrl;
    console.log(`original url: ${url}`);
    url = url.includes("page") ? url : `${url}?page=${current}`;
    console.log(`modified url: ${url}`);
    const project = new Project(pool, userid, admin, limit);
    const pageNumbers = project.getConditional().countPages();
    const findProjects = project.find(["id", "name", "member"],(current-1)*limit);
    Promise.all([pageNumbers, findProjects])
      .then(results => {
        res.render("projects", {
          title: `${req.session.user.firstname} ${req.session.user.lastname} - Projects`,
          path: "/projects",
          userid,
          admin,
          current,
          url,
          numOfPages: results[0],
          data: results[1].rows,
          colNames: ["#", "Name", "Members"],
          colPg: ["projectid", "projectname", "member"]
        });
      })
      .catch(e => res.render("error", { message: "Error", error: e }));
  });
  return router;
};
