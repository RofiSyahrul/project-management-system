const User = require("../models/user");

const positions = ["Manager", "Software Developer", "Quality Assurance"];
const jobTypes = ["Fulltime", "Parttime"];

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
  "Nick name",
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
const formAddOptions = [, , , , , positions, ["Fulltime"]];

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
          if (name == "fulltime") value = value == "Fulltime"; // change value to boolean
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
          item.fulltime = item.fulltime ? "Fulltime" : "Parttime";
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
  }
};
