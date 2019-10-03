const Member = require("../models/member");
const User = require("../models/user");

module.exports = {
  // get member page of a project
  getList(pool, limit) {
    return (req, res) => {
      const roles = ["Manager", "Programmer", "Quality Assurance"];
      const { userid, admin, nickname, memberopt } = req.session.user;
      const { projectId } = req.params;
      const query = req.query;
      const checked = query.checkBox || [];
      const current = Number(query.page || 1);

      // define options for column options
      let options = [
        { name: "userid", label: "ID", colName: "User ID" },
        { name: "fullname", label: "Name", colName: "Name" },
        { name: "role", label: "Role", colName: "Role" }
      ];
      options = options.map(opt => Object.assign({ colPg: opt.name }, opt));

      // define forms for filter form
      let forms = [
        { type: "number", value: query.userid || "" },
        { type: "text", value: query.fullname || "" },
        {
          type: "select",
          value: query.role || "",
          options: roles,
          optValues: roles
        }
      ];
      forms = options.map((opt, i) => Object.assign(forms[i], opt));

      let url1 = req.originalUrl;
      let url = url1.includes("page") ? url1 : `${url1}?page=${current}`;
      let title = `${nickname} | Members of Project #${projectId}`;
      title += admin ? " | Admin" : "";

      // processing constraints from filter form
      const constraints = options
        .map(opt => opt.name)
        .reduce((obj, name) => {
          obj[name] = checked.includes(name) ? query[name] : undefined;
          return obj;
        }, {});
      const members = new Member(pool, projectId, limit);
      const countPages = members.getConditional(constraints).countPage();
      // filtering active columns from user's session
      const columns = Object.keys(memberopt).filter(opt => memberopt[opt]);
      const findMembers = members.find((current - 1) * limit);
      // getting project's name
      const getProjectName = members.getProjectName();
      // execute queries via promise and render list page for member
      Promise.all([countPages, findMembers, getProjectName])
        .then(results => {
          res.render("projects/members/list", {
            title,
            path: "/projects",
            projectPath: "/members",
            tableName: "Members",
            userid,
            admin,
            projectId,
            projectName: results[2].rows[0].projectname,
            checked,
            forms,
            options,
            columns,
            current,
            url,
            url1,
            notifAlert: req.flash("notifAlert")[0],
            warningAlert: req.flash("warningAlert")[0],
            numOfPages: results[0],
            data: results[1].rows,
            primaryKey: "userid",
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
      let { userid, memberopt } = req.session.user;
      userid = Number(userid);
      const columns = req.body.options || [];
      const { url } = req.body;

      memberopt = Object.keys(memberopt).reduce((opts, key) => {
        opts[key] = columns.includes(key);
        return opts;
      }, {});

      User.updateOpt(pool, "memberopt", memberopt, userid)
        .then(() => {
          req.session.user.memberopt = memberopt;
          res.redirect(url);
        })
        .catch(e => res.render("error", { message: "Error", error: e }));
    };
  },

  // get page for adding member
  add(pool) {
    return (req, res) => {
      const { userid, admin, nickname } = req.session.user;
      const { projectId } = req.params;
      const roles = ["Manager", "Programmer", "Quality Assurance"];

      const members = new Member(pool, projectId);
      const getMembersIn = members.find(["userid"]);
      const getAllUsers = User.getUsers(pool);
      const getProjectName = members.getProjectName();

      Promise.all([getMembersIn, getAllUsers, getProjectName])
        .then(results => {
          let [membersIn, allMembers, projectName] = results.map(
            result => result.rows
          );
          membersIn = membersIn.map(member => member.userid);
          let membersNotIn = allMembers.filter(
            member => !membersIn.includes(member.userid)
          );

          if (membersNotIn.length == 0) {
            req.flash(
              "warningAlert",
              `All users have been assigned to project #${projectId}`
            );
            res.redirect(`/projects/members/${projectId}`);
          } else {
            let forms = [
              {
                name: "userid",
                label: "Member",
                type: "select",
                options: membersNotIn.map(x => x.fullname),
                optValues: membersNotIn.map(x => x.userid)
              },
              {
                name: "role",
                label: "Role",
                type: "radio",
                options: roles,
                optValues: roles
              }
            ];
            res.render("projects/members/add", {
              title: `${nickname} | Add Member to Project #${projectId}`,
              userid,
              admin,
              path: "/projects",
              projectPath: "/members",
              projectId,
              projectName: projectName[0].projectname,
              forms,
              submit: "Save"
            });
          }
        })
        .catch(e => res.render("error", { message: "Error", error: e }));
    };
  },

  save(pool, limit = 2) {
    return (req, res) => {
      const { projectId } = req.params;
      const { userid, role } = req.body;
      User.getUsers(pool, userid)
        .then(result => {
          const fullname = result.rows[0].fullname;
          const member = new Member(pool, projectId, limit);
          member
            .save(userid, role, fullname)
            .then(message => {
              req.flash("notifAlert", message);
              // redirect to the page where the added data is located
              member.conditional += ` AND userid <= ${userid}`;
              member
                .countPage()
                .then(pageNum => {
                  res.redirect(
                    `/projects/members/${projectId}?page=${pageNum}`
                  );
                })
                .catch(e =>
                  res.render("error", { message: "Error", error: e })
                );
            })
            .catch(e => res.render("error", { message: "Error", error: e }));
        })
        .catch(e => res.render("error", { message: "Error", error: e }));
    };
  },

  edit(pool) {
    return (req, res) => {
      // userid: logged in user. userId: edited user as a member of the project.
      const { userid, admin, nickname } = req.session.user;
      const { projectId, userId } = req.params;
      const roles = ["Manager", "Programmer", "Quality Assurance"];

      const members = new Member(pool, projectId);
      const getMember = members.getConditional({ userid: userId }).find();
      const getProjectName = members.getProjectName();

      Promise.all([getMember, getProjectName])
        .then(results => {
          let [member, projectName] = results.map(result => result.rows[0]);
          projectName = Object.values(projectName)[0];
          let forms = [
            {
              name: "fullname",
              label: "Member",
              type: "text",
              ro: true,
              maxlength: 150
            },
            {
              name: "role",
              label: "Role",
              type: "radio",
              options: roles,
              optValues: roles
            }
          ];
          forms = forms.map(form =>
            Object.assign({ value: member[form.name] }, form)
          );
          // hidden object
          forms.push({
            name: "oldRole",
            type: "hidden",
            ro: true,
            value: member.role
          });

          res.render("projects/members/edit", {
            title: `${nickname} | Edit Member in Project #${projectId}`,
            userid,
            admin,
            path: "/projects",
            projectPath: "/members",
            projectId,
            projectName,
            forms,
            submit: "Update"
          });
        })
        .catch(e => res.render("error", { message: "Error", error: e }));
    };
  },

  update(pool, limit = 2) {
    return (req, res) => {
      const { projectId, userId } = req.params;
      const { fullname, role, oldRole } = req.body;
      const member = new Member(pool, projectId, limit);
      member
        .update(userId, oldRole, role, fullname)
        .then(message => {
          req.flash("notifAlert", message);
          // redirect to the page where the edited member is located
          member.conditional += ` AND userid <= ${userId}`;
          member
            .countPage()
            .then(pageNum => {
              res.redirect(`/projects/members/${projectId}?page=${pageNum}`);
            })
            .catch(e => res.render("error", { message: "Error", error: e }));
        })
        .catch(e => res.render("error", { message: "Error", error: e }));
    };
  },

  del(pool, limit = 2) {
    return (req, res) => {
      const { projectId, userId } = req.params;
      const member = new Member(pool, projectId, limit);
      member.conditional += ` AND userid <= ${userId}`;
      member
        .countPage()
        .then(pageNum => {
          member
            .del(userId)
            .then(() => {
              req.flash(
                "notifAlert",
                `User #${userId} has been deleted from project #${projectId}`
              );
              // redirect to the page where the edited member is located or the last page
              member.conditional = `WHERE projectid = ${projectId}`;
              member
                .countPage()
                .then(lastPage => {
                  pageNum = pageNum <= lastPage ? pageNum : lastPage;
                  res.redirect(
                    `/projects/members/${projectId}?page=${pageNum}`
                  );
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
