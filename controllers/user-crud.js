const User = require("../models/user");

const positions = ["Manager", "Software Developer", "Quality Assurance"];
const jobTypes = ["Full time", "Part time"];

const colOptionsName = [
  "userid",
  "fullname",
  "nickname",
  "email",
  "position",
  "fulltime"
];
const colNames = [
  "User ID",
  "Fullname",
  "Nickname",
  "Email",
  "Position",
  "Job type"
];
const formTypes = ["number", "text", "text", "text", "select", "select"];
const formOptions = [, , , , positions, jobTypes];

const formAddNames = [
  "firstname",
  "lastname",
  "nickname",
  "email",
  "password",
  "position",
  "fulltime"
];
const formAddLabels = [
  "First name",
  "Last name",
  "Nickname",
  "Email",
  "Password",
  "Position",
  "Job type"
];
const formAddTypes = [
  "text",
  "text",
  "text",
  "email",
  "password",
  "radio",
  "checkbox"
];
const formAddOptions = [, , , , , positions, ["Full time"]];

module.exports = {
  getList(pool, limit) {
    return (req, res) => {
      const { userid, admin, nickname, useropt } = req.session.user;
      const query = req.query;
      const checked = query.checkBox || [];
      const current = Number(query.page || 1);

      // define options for column displayed
      let options = colOptionsName.map((name, i) => {
        return { name, label: colNames[i], colName: colNames[i], colPg: name };
      });
      // define forms for filter
      let forms = options.map((opt, i) => {
        return Object.assign(
          {
            type: formTypes[i],
            options: formOptions[i],
            optValues: formOptions[i],
            value: query[opt.name]
          },
          opt
        );
      });

      // filtering active columns from user's session
      const columns = Object.keys(useropt).filter(opt => useropt[opt]);

      // processing constraints from filter form
      const constraints = forms
        .map(form => form.name)
        .reduce((obj, name) => {
          let value = query[name];
          if (name == "fulltime") value = value == "Full time"; // change value to boolean
          obj[name] = checked.includes(name) ? value : undefined;
          return obj;
        }, {});

      let url1 = req.originalUrl;
      let url = url1.includes("page") ? url1 : `${url1}?page=${current}`;
      let title = `${nickname} | Users | Admin`;

      const users = new User(pool, undefined, limit);
      const countPages = users.getConditionals(constraints).countPage();
      const getAllUsers = users.findAll((current - 1) * limit);

      Promise.all([countPages, getAllUsers]).then(results => {
        let data = results[1].rows;
        data = data.map(item => {
          item.fulltime = item.fulltime ? "Full time" : "Part time";
          return item;
        });

        res.render("users/list", {
          title,
          path: "/users",
          projectPath: "",
          tableName: "Users",
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
          warningAlert: req.flash("warningAlert")[0],
          numOfPages: results[0],
          data,
          primaryKey: "userid",
          colNames: options
            .filter(opt => columns.includes(opt.name))
            .map(opt => opt.colName),
          colPg: options
            .filter(opt => columns.includes(opt.name))
            .map(opt => opt.colPg)
        });
      });
    };
  },

  applyOptions(pool) {
    return (req, res) => {
      let { userid, useropt } = req.session.user;
      userid = Number(userid);
      const columns = req.body.options || [];
      const { url } = req.body;

      useropt = Object.keys(useropt).reduce((opts, key) => {
        opts[key] = columns.includes(key);
        return opts;
      }, {});

      User.updateOpt(pool, "useropt", useropt, userid)
        .then(() => {
          req.session.user.useropt = useropt;
          res.redirect(url);
        })
        .catch(e => res.render("error", { message: "Error", error: e }));
    };
  },

  add() {
    return (req, res) => {
      const { userid, admin, nickname } = req.session.user;

      let forms = formAddNames.map((name, i) => {
        return {
          name,
          label: formAddLabels[i],
          type: formAddTypes[i],
          maxlength: 30,
          options: formAddOptions[i],
          optValues: formAddOptions[i],
          req: name != "fulltime"
        };
      });

      res.render("users/add", {
        title: `${nickname} | Add User`,
        userid,
        admin,
        forms,
        path: "/projects",
        projectPath: "",
        submit: "Save"
      });
    };
  },

  save(pool, limit = 2) {
    return (req, res) => {
      let data = req.body;
      data.fulltime = data.fulltime == "Full time";

      const users = new User(pool, undefined, limit);
      users
        .save(data)
        .then(() => {
          req.flash(
            "notifAlert",
            `New user (${data.firstname} ${data.lastname}) has been added.`
          );
          // redirect to the last page
          users
            .countPage()
            .then(lastPage => {
              res.redirect(`/users?page=${lastPage}`);
            })
            .catch(e => res.render("error", { message: "Error", error: e }));
        })
        .catch(e => res.render("error", { message: "Error", error: e }));
    };
  },

  edit(pool) {
    return (req, res) => {
      const { userId } = req.params;
      const { userid, admin, nickname } = req.session.user;

      let forms = formAddNames.map((name, i) => {
        return {
          name,
          label: formAddLabels[i],
          type: formAddTypes[i],
          maxlength: 30,
          options: formAddOptions[i],
          optValues: formAddOptions[i],
          req: !["fulltime", "password"].includes(name),
          ro: name == "email"
        };
      });

      User.findById(pool, userId)
        .then(result => {
          const data = result.rows[0];
          data.fulltime = data.fulltime ? "Full time" : "";
          data.password = "";
          forms = forms.map(form => {
            return Object.assign({ value: data[form.name] }, form);
          });
          forms.push(
            ...Object.keys(data).map(key => {
              return {
                name: key + "OldValue",
                type: "hidden",
                value: data[key]
              };
            })
          );
          res.render("users/edit", {
            title: `${nickname} | Edit User`,
            userid,
            admin,
            path: "/users",
            projectPath: "",
            forms,
            submit: "Update"
          });
        })
        .catch(e => res.render("error", { message: "Error", error: e }));
    };
  },

  update(pool, limit) {
    return (req, res) => {
      const { userId } = req.params;
      const { is_owner } = req.session.user;

      const keys = Object.keys(req.body);
      const keysOldValue = keys.filter(key => key.match(/(OldValue)$/));
      let keysNewValue = keys.filter(key => !key.match(/(OldValue)$/));
      if (!keysNewValue.includes("fulltime")) keysNewValue.push("fulltime");

      const oldValues = keysOldValue.reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

      // filtering all new values that differ from the related old value
      let newValues = keysNewValue.reduce((obj, key) => {
        if (key == "fulltime") {
          const oldCond = oldValues[`${key}OldValue`] == "Full time";
          const newCond = req.body[key] || "";
          if ((oldCond && newCond == "") || (!oldCond && newCond != ""))
            obj[key] = newCond == "Full time";
        } else if (
          oldValues[`${key}OldValue`] !== req.body[key] &&
          req.body[key].trim().length > 0
        ) {
          obj[key] = req.body[key];
        }
        return obj;
      }, {});

      if (newValues.password && !is_owner) {
        // could not update password
        delete newValues.password;
        req.flash(
          "warningAlert",
          "<b>Sorry.</b> Only the owner can edit password."
        );
      }

      const user = new User(pool, undefined, limit);
      user
        .update(newValues, userId)
        .then(message => {
          req.flash("notifAlert", message);
          // redirect to the page where userid is located
          user.conditional += ` AND userid <= ${userId}`;
          user
            .countPage()
            .then(pageNum => {
              res.redirect(`/users?page=${pageNum}`);
            })
            .catch(e => res.render("error", { message: "Error", error: e }));
        })
        .catch(e => res.render("error", { message: "Error", error: e }));
    };
  },

  del(pool, limit = 2) {
    return (req, res) => {
      const { userId } = req.params;
      const { is_owner } = req.session.user;

      const users = new User(pool, undefined, limit);
      users.conditional += ` AND userid <= ${userId}`;
      users
        .countPage()
        .then(pageNum => {
          if (is_owner) {
            users
              .del(userId)
              .then(() => {
                users.conditional = `WHERE userid != 1`;
                users
                  .countPage()
                  .then(lastPage => {
                    req.flash(
                      "notifAlert",
                      `User #${userId} has been deleted.`
                    );
                    if (pageNum > lastPage) pageNum = lastPage;
                    res.redirect(`/users?page=${pageNum}`);
                  })
                  .catch(e =>
                    res.render("error", { message: "Error", error: e })
                  );
              })
              .catch(e => res.render("error", { message: "Error", error: e }));
          } else {
            req.flash(
              "warningAlert",
              "<b>Sorry.</b> Only the owner can delete user."
            );
            res.redirect(`/users?page=${pageNum}`);
          }
        })
        .catch(e => res.render("error", { message: "Error", error: e }));
    };
  }
};
