const express = require("express");
const router = express.Router();
const checkAuth = require("../controller/functions").checkAuth;
const User = require("../models/user");
const Project = require("../models/project");

module.exports = (pool, limit = 2) => {
  // get home page of project
  router.get("/:userid", checkAuth, (req, res) => {
    const userid = req.session.user.userid;
    const admin = req.session.user.admin;
    const query = req.query;
    const checked = query.checkBox || [];
    const current = Number(query.page || 1);

    const options = [
      { name: "id", label: "ID", colName: "#", colPg: "projectid" },
      { name: "name", label: "Name", colName: "Name", colPg: "projectname" },
      { name: "member", label: "Members", colName: "Members", colPg: "member" }
    ];

    let url = req.originalUrl;
    url = url.includes("page") ? url : `${url}?page=${current}`;
    let title = `${req.session.user.firstname} ${req.session.user.lastname} | Projects`;
    title += admin ? " | Admin" : "";

    const project = new Project(pool, userid, admin, limit);
    const constraints = {
      memberName: checked.includes("member") ? query.member : undefined,
      projectId: checked.includes("id") ? query.id : undefined,
      projectName: checked.includes("name") ? query.name : undefined
    };
    const pageNumbers = project.getConditional(constraints).countPages();
    const projectOpt = req.session.user.projectopt;
    const columns = Object.keys(projectOpt).filter(opt => projectOpt[opt]);
    const findProjects = project.find(columns, (current - 1) * limit);
    const allMember = project.getAllMember();
    Promise.all([pageNumbers, findProjects, allMember])
      .then(results => {
        let forms = [
          { type: "number", value: query.id || "" },
          { type: "text", value: query.name || "" },
          {
            type: "select",
            value: query.member || "",
            options: results[2].rows.map(x => x.member)
          }
        ];
        forms = options.map((opt, i) => Object.assign(forms[i], opt));
        forms[2].label = "Member";
        res.render("projects", {
          title,
          path: "/projects",
          userid,
          admin,
          checked,
          forms,
          options,
          columns,
          current,
          url,
          numOfPages: results[0],
          data: results[1].rows,
          colNames: options
            .filter(opt => columns.includes(opt.name))
            .map(opt => opt.colName),
          colPg: options
            .filter(opt => columns.includes(opt.name))
            .map(opt => opt.colPg)
        });
      })
      .catch(e => res.render("error", { message: "Error", error: e }));
  });

  // apply column options
  router.post("/:userid", checkAuth, (req, res) => {
    const userid = Number(req.params.userid);
    const columns = req.body.options || [];

    let projectOpt = req.session.user.projectopt;
    projectOpt = Object.keys(projectOpt).reduce((opts, key) => {
      opts[key] = columns.includes(key);
      return opts;
    }, {});

    User.updateOpt(pool, "projectopt", projectOpt, userid)
      .then(() => {
        req.session.user.projectopt = projectOpt;
        res.redirect(`/projects/${userid}`);
      })
      .catch(e => res.render("error", { message: "Error", error: e }));
  });

  return router;
};
