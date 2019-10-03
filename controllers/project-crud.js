const Project = require("../models/project");
const User = require("../models/user");

function createForm(membersName = [], membersUID = []) {
  return [
    {
      name: "projectname",
      label: "Project Name",
      type: "text",
      maxlength: 100,
      ro: false
    },
    {
      name: "members",
      label: "Members",
      type: "checkbox",
      options: membersName,
      optValues: membersUID
    }
  ];
}

module.exports = {
  // get home page of project
  getList(pool, limit = 2) {
    return (req, res) => {
      const userid = req.session.user.userid;
      const admin = req.session.user.admin;
      const query = req.query;
      const checked = query.checkBox || [];
      const current = Number(query.page || 1);

      const options = [
        { name: "id", label: "ID", colName: "#", colPg: "projectid" },
        { name: "name", label: "Name", colName: "Name", colPg: "projectname" },
        {
          name: "member",
          label: "Members",
          colName: "Members",
          colPg: "member"
        }
      ];

      let url1 = req.originalUrl;
      let url = url1.includes("page") ? url1 : `${url1}?page=${current}`;
      let title = `${req.session.user.nickname} | Projects`;
      title += admin ? " | Admin" : "";

      const project = new Project(pool, userid, admin, limit);
      const constraints = {
        userId: checked.includes("member") ? query.member : undefined,
        projectId: checked.includes("id") ? query.id : undefined,
        projectName: checked.includes("name") ? query.name : undefined
      };
      const pageNumbers = project.getConditional(constraints).countPages();
      const projectOpt = req.session.user.projectopt;
      const columns = Object.keys(projectOpt).filter(opt => projectOpt[opt]);
      const findProjects = project.find((current - 1) * limit);
      const allMember = Project.getMembers(pool);
      Promise.all([pageNumbers, findProjects, allMember])
        .then(results => {
          let forms = [
            { type: "number", value: query.id || "" },
            { type: "text", value: query.name || "" },
            {
              type: "select",
              value: query.member || "",
              options: results[2].rows.map(x => x.member),
              optValues: results[2].rows.map(x => x.userid)
            }
          ];
          forms = options.map((opt, i) => Object.assign(forms[i], opt));
          forms[2].label = "Member";
          res.render("projects/list", {
            title,
            path: "/projects",
            projectPath: "",
            tableName: "Projects",
            userid,
            admin,
            checked,
            forms,
            options,
            columns,
            current,
            url,
            url1,
            notifAlert: req.flash("notifAlert")[0],
            numOfPages: results[0],
            data: results[1].rows,
            primaryKey: "projectid",
            colNames: options
              .filter(opt => columns.includes(opt.name))
              .map(opt => opt.colName),
            colPg: options
              .filter(opt => columns.includes(opt.name))
              .map(opt => opt.colPg)
          });
        })
        .catch(e => res.render("error", { message: "Error", error: e }));
    };
  },

  // apply column options
  applyOptions(pool) {
    return (req, res) => {
      const userid = Number(req.session.user.userid);
      const columns = req.body.options || [];
      const { url } = req.body;

      let projectOpt = req.session.user.projectopt;
      projectOpt = Object.keys(projectOpt).reduce((opts, key) => {
        opts[key] = columns.includes(key);
        return opts;
      }, {});

      User.updateOpt(pool, "projectopt", projectOpt, userid)
        .then(() => {
          req.session.user.projectopt = projectOpt;
          res.redirect(url);
        })
        .catch(e => res.render("error", { message: "Error", error: e }));
    };
  },

  // get page for adding project
  add(pool) {
    return (req, res) => {
      const { userid, admin, nickname } = req.session.user;
      Project.getMembers(pool)
        .then(result => {
          const allUsersId = result.rows.map(x => x.userid);
          const allMember = result.rows.map(x => x.member);
          let forms = createForm(allMember, allUsersId);
          res.render("projects/add", {
            title: `${nickname} | Add Project`,
            userid,
            admin,
            forms,
            path: "/projects",
            projectPath: "",
            submit: "Save"
          });
        })
        .catch(e => res.render("error", { message: "Error", error: e }));
    };
  },

  // save added project to database
  save(pool, limit = 2) {
    return (req, res) => {
      const { projectname, members } = req.body;
      const project = new Project(pool, "", "", limit);
      project
        .save(projectname, members)
        .then(message => {
          req.flash("notifAlert", message);
          // redirect to the last page
          project
            .countPages()
            .then(lastPage => {
              res.redirect(`/projects?page=${lastPage}`);
            })
            .catch(e => res.render("error", { message: "Error", error: e }));
        })
        .catch(e => res.render("error", { message: "Error", error: e }));
    };
  },

  // get page for editing a project
  edit(pool) {
    return (req, res) => {
      const { projectId } = req.params;
      const { userid, admin, nickname } = req.session.user;
      const project = new Project(pool, userid, admin);
      const getProjectName = project
        .getConditional({ projectId })
        .find(["name"]);
      const getAllMembers = Project.getMembers(pool);
      const getMembersIn = Project.getMembers(pool, projectId);

      Promise.all([getProjectName, getAllMembers, getMembersIn])
        .then(results => {
          let [projectName, allMembers, membersIn] = results.map(
            result => result.rows
          );
          projectName = projectName[0].projectname;
          membersIn = membersIn.map(x => x.userid);
          const values = [projectName, membersIn];
          const allMembersName = allMembers.map(x => x.member);
          const allMembersUID = allMembers.map(x => x.userid);
          let forms = createForm(allMembersName, allMembersUID);
          forms = forms.map((form, i) =>
            Object.assign({ value: values[i] }, form)
          );
          res.render("projects/edit", {
            title: `${nickname} | Edit Project${admin ? " | Admin" : ""}`,
            userid,
            admin,
            forms,
            path: "/projects",
            projectPath: "",
            submit: "Update"
          });
        })
        .catch(e => res.render("error", { message: "Error", error: e }));
    };
  },

  // update project
  update(pool, limit = 2) {
    return (req, res) => {
      const { projectId } = req.params;
      const { projectname, members } = req.body;
      const project = new Project(pool, "", "", limit);
      project
        .update(projectId, projectname, members)
        .then(message => {
          req.flash("notifAlert", message);
          // redirect to the page where the updated project is located
          project.conditional = `WHERE proj.projectid <= ${Number(projectId)}`;
          project
            .countPages()
            .then(currentPage => {
              res.redirect(`/projects?page=${currentPage}`);
            })
            .catch(e => res.render("error", { message: "Error", error: e }));
        })
        .catch(e => res.render("error", { message: "Error", error: e }));
    };
  },

  // delete project
  del(pool, limit = 2) {
    return (req, res) => {
      const { projectId } = req.params;
      const project = new Project(pool, "", "", limit);
      // redirect to the page where the deleted project is located or to the last page
      project.conditional = `WHERE proj.projectid <= ${Number(projectId)}`;
      project
        .countPages()
        .then(pageNum => {
          project
            .del(Number(projectId))
            .then(() => {
              req.flash("notifAlert", `Project #${projectId} has been deleted`);
              project.conditional = "";
              project
                .countPages()
                .then(lastPage => {
                  pageNum = pageNum <= lastPage ? pageNum : lastPage;
                  res.redirect(`/projects?page=${pageNum}`);
                })
                .catch(e =>
                  res.render("error", { message: "Error", error: e })
                );
            })
            .catch(e => res.render("error", { message: "Error", error: e }));
        })
        .catch(e => res.render("error", { message: "Error", error: e }));
    };
  }
};
