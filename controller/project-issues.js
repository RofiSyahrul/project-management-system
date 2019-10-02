const moment = require("moment");
const path = require("path");
const fs = require("fs");
const Issue = require("../models/issue");
const Project = require("../models/project");
const User = require("../models/user");
const Activity = require("../models/activity");

function createFileName(uploaded = "", projectId = 1) {
  let fileName = uploaded.split(" ").join("-");
  let projectStr = `project${projectId.toString().padStart(3, "0")}`;
  let now = moment().format("YYYY_MM_DD-HH_mm_ss_SSS");
  fileName = `${projectStr}-${now}-${fileName}`;
  let filePath = path.join(__dirname, "..", "public", "uploaded", fileName);
  return { fileName, filePath };
}

function convertDate(date = "") {
  date = date.split("/").join("-");
  return moment(date, ["MM-DD-YYYY", "YYYY-MM-DD"]).format("YYYY-MM-DD");
}

const tracker = ["Bug", "Feature", "Support"];
const status = [
  "New",
  "In Progress",
  "Feedback",
  "Resolved",
  "Closed",
  "Rejected"
];
const disableStatus = [false, ...[...Array(5)].map(x => true)];
const priority = ["Normal", "High", "Urgent", "Immediate"];
const done = [...Array(11).keys()].map(x => x * 10);

const colOptionsName = [
  "issueid",
  "tracker",
  "subject",
  "description",
  "status",
  "priority",
  "assignee_name",
  "startdate",
  "duedate",
  "estimatedtime",
  "done",
  "files",
  "spenttime",
  "targetversion",
  "author_name",
  "createddate",
  "updateddate",
  "closeddate",
  "parent_task"
];
const colNames = [
  "Issue ID",
  "Tracker",
  "Subject",
  "Description",
  "Status",
  "Priority",
  "Assignee",
  "Start Date",
  "Due Date",
  "Estimated Time (hours)",
  "Done (%)",
  "File",
  "Spent Time (hours)",
  "Target Version",
  "Author",
  "Created Date",
  "Updated Date",
  "Closed Date",
  "Parent Task"
];

const formTypes = [
  "number",
  "select",
  "text",
  "select",
  "select",
  "select",
  "date",
  "date",
  "select",
  "date"
];
const formOptions = [[], tracker, [], status, priority, [], [], [], done, []];

const addTypes = [
  "radio",
  "text",
  "textarea",
  "radio",
  "radio",
  "select",
  "date",
  "date",
  "number",
  "select",
  "file"
];
const addOpt = [tracker, , , status, priority, , , , , done];

let editNames = [...colOptionsName.slice(1, 15), "parenttask"];
editNames[5] = "assignee";
editNames.push("author");
let editLabels = [...colNames.slice(1, 15), colNames[18]];
const editTypes = [
  "radio",
  "text",
  "textarea",
  "radio",
  "radio",
  "select",
  "date",
  "date",
  "number",
  "select",
  "file",
  "number",
  "text",
  "text",
  "select",
  "hidden"
];
const editOpt = [tracker, , , status, priority, , , , , done, , , , ,];

module.exports = {
  getList(pool, limit = 2) {
    return (req, res) => {
      const { userid, admin, nickname, issueopt } = req.session.user;
      const { projectId } = req.params;
      const query = req.query;
      const checked = query.checkBox || [];
      const current = Number(query.page || 1);

      // define options for column displayed
      let options = colOptionsName.map((name, i) => {
        return { name, label: colNames[i], colName: colNames[i], colPg: name };
      });
      options[6].name = "assignee";
      options[14].name = "author";

      // filtering active columns from user's session
      const columns = Object.keys(issueopt).filter(opt => issueopt[opt]);

      // define forms for filter
      let forms = [
        ...options.slice(0, 3),
        ...options.slice(4, 9),
        options[10],
        options[16]
      ];
      forms = forms.map((form, i) => {
        return Object.assign(
          {
            type: formTypes[i],
            options: formOptions[i],
            optValues: formOptions[i],
            value: query[form.name]
          },
          form
        );
      });

      let url1 = req.originalUrl;
      let url = url1.includes("page") ? url1 : `${url1}?page=${current}`;
      let title = `${nickname} | Issues of Project #${projectId}`;
      title += admin ? " | Admin" : "";

      // processing constraints from filter form
      const constraints = forms
        .map(form => form.name)
        .reduce((obj, name) => {
          obj[name] = checked.includes(name) ? query[name] : undefined;
          return obj;
        }, {});
      if (constraints.startdate) {
        const startdate = constraints.startdate.split("/").join("-");
        constraints.startdate = moment(startdate, "MM-DD-YYYY").format(
          "YYYY-MM-DD"
        );
      }
      if (constraints.duedate) {
        const duedate = constraints.duedate.split("/").join("-");
        constraints.duedate = moment(duedate, "MM-DD-YYYY").format(
          "YYYY-MM-DD"
        );
      }

      const getMembersIn = Project.getMembers(pool, projectId);
      const issues = new Issue(pool, projectId, limit);
      const countPages = issues.getConditionals(constraints).countPage();
      const findIssues = issues.find((current - 1) * limit);
      const getProjectName = issues.getProjectName();

      Promise.all([getMembersIn, countPages, findIssues, getProjectName])
        .then(results => {
          let [membersIn, numOfPages, data, projectName] = results.map(
            result => result.rows
          );
          numOfPages = results[1];
          forms[5].options = membersIn.map(x => x.member);
          forms[5].optValues = membersIn.map(x => x.userid);
          data.forEach((row, i) => {
            data[i].startdate = moment(row.startdate).format("MMMM Do, YYYY");
            data[i].duedate = moment(row.duedate).format("MMMM Do, YYYY");
            data[i].updateddate = moment(row.updateddate).format(
              "MMMM Do, YYYY - HH:mm:ss"
            );
            data[i].createddate = moment(row.createddate).format(
              "MMMM Do, YYYY - HH:mm:ss"
            );
          });
          res.render("projects/issues/list", {
            title,
            path: "/projects",
            projectPath: "/issues",
            tableName: "Issues",
            userid,
            admin,
            projectId,
            projectName: projectName[0].projectname,
            checked,
            forms,
            options,
            columns,
            current,
            url,
            url1,
            notifAlert: req.flash("notifAlert")[0],
            warningAlert: req.flash("warningAlert")[0],
            numOfPages,
            data,
            primaryKey: "issueid",
            colNames: options
              .filter(opt => columns.includes(opt.name))
              .map(opt => opt.colName),
            colPg: options
              .filter(opt => columns.includes(opt.name))
              .map(opt => opt.colPg),
            pathLib: path
          });
        })
        .catch(e => res.render("error", { message: "Error", error: e }));
    };
  },

  applyOptions(pool) {
    return (req, res) => {
      let { userid, issueopt } = req.session.user;
      userid = Number(userid);
      const columns = req.body.options || [];
      const { url } = req.body;

      issueopt = Object.keys(issueopt).reduce((opts, key) => {
        opts[key] = columns.includes(key);
        return opts;
      }, {});

      User.updateOpt(pool, "issueopt", issueopt, userid)
        .then(() => {
          req.session.user.issueopt = issueopt;
          res.redirect(url);
        })
        .catch(e => res.render("error", { message: "Error", error: e }));
    };
  },

  // get page for adding issue
  add(pool) {
    return (req, res) => {
      const { userid, admin, nickname } = req.session.user;
      const { projectId } = req.params;

      let forms = [...Array(11).keys()].map(i => {
        return {
          name: colOptionsName[i + 1],
          label: colNames[i + 1],
          type: addTypes[i],
          options: addOpt[i],
          optValues: addOpt[i],
          req: true
        };
      });
      forms[1].maxlength = 50;
      forms[3].disable = disableStatus;
      forms[5].name = "assignee";
      forms[5].req = false;
      forms[8].step = 0.0001;

      const issue = new Issue(pool, projectId);
      const getMembersIn = Project.getMembers(pool, projectId);
      const getProjectName = issue.getProjectName();

      Promise.all([getMembersIn, getProjectName])
        .then(results => {
          let [membersIn, projectName] = results.map(result => result.rows);
          forms[5].options = membersIn.map(x => x.member);
          forms[5].optValues = membersIn.map(x => x.userid);
          res.render("projects/issues/add", {
            title: `${nickname} | New Issue in Project #${projectId}`,
            userid,
            admin,
            path: "/projects",
            projectPath: "/issues",
            projectId,
            projectName: projectName[0].projectname,
            forms,
            submit: "Save"
          });
        })
        .catch(e => res.render("error", { message: "Error", error: e }));
    };
  },

  save(pool, limit = 2) {
    return (req, res) => {
      const { projectId } = req.params;
      const { userid } = req.session.user;
      let data = req.body;
      data.author = userid;
      data.projectid = projectId;

      data.startdate = convertDate(data.startdate);
      data.duedate = convertDate(data.duedate);

      let file = req.files.files;
      const { fileName, filePath } = createFileName(file.name, projectId);
      data.files = `/uploaded/${fileName}`;

      if (data.assignee == "") delete data.assignee;

      file.mv(filePath, e => {
        if (e) res.render("error", { message: "Error", error: e });
        else {
          const issue = new Issue(pool, projectId, limit);
          issue
            .save(data)
            .then(() => {
              req.flash(
                "notifAlert",
                `New issue (${data.tracker}) has been added`
              );
              // redirect to the last page
              issue
                .countPage()
                .then(lastPage => {
                  res.redirect(
                    `/projects/issues/${projectId}?page=${lastPage}`
                  );
                })
                .catch(e =>
                  res.render("error", { message: "Error", error: e })
                );
            })
            .catch(e => res.render("error", { message: "Error", error: e }));
        }
      });
    };
  },

  edit(pool) {
    return (req, res) => {
      const { userid, admin, nickname } = req.session.user;
      const { projectId, issueId } = req.params;

      const issues = new Issue(pool, projectId);
      const getIssue = issues.getConditionals({ issueid: issueId }).find();
      const getProjectName = issues.getProjectName();
      const getOtherIssues = issues.getAllIssuesId(issueId);
      const getMembersIn = Project.getMembers(pool, projectId);

      Promise.all([getIssue, getProjectName, getOtherIssues, getMembersIn])
        .then(results => {
          let [issue, projectName, otherIssues, members] = results.map(
            r => r.rows
          );
          issue.forEach((item, i) => {
            issue[i].startdate = moment(item.startdate).format("MM/DD/YYYY");
            issue[i].duedate = moment(item.duedate).format("MM/DD/YYYY");
          });
          projectName = projectName[0].projectname;
          const otherIssuesSubj = otherIssues.map(x => x.subject);
          const otherIssuesId = otherIssues.map(x => x.issueid);
          const membersName = members.map(x => x.member);
          const membersUID = members.map(x => x.userid);

          let forms = editNames.map((name, i) => {
            let value = issue[0][name];
            let [options, optValues] = [editOpt[i], editOpt[i]];
            let disable;
            if (name === "assignee")
              [options, optValues] = [membersName, membersUID];
            else if (name === "parenttask")
              [options, optValues] = [otherIssuesSubj, otherIssuesId];
            else if (name === "tracker")
              disable = optValues.map(opt => opt != value);
            return {
              name,
              label: editLabels[i],
              type: editTypes[i],
              options,
              optValues,
              req: ![
                "assignee",
                "files",
                "parenttask",
                "targetversion",
                "spenttime"
              ].includes(name),
              ro: ["author_name", "estimatedtime"].includes(name),
              step: ["estimatedtime", "spenttime"].includes(name)
                ? 0.0001
                : undefined,
              value,
              disable
            };
          });
          forms.push(
            ...Object.keys(issue[0]).map(key => {
              return {
                name: key + "OldValue",
                type: "hidden",
                value: issue[0][key]
              };
            })
          );
          res.render("projects/issues/edit", {
            title: `${nickname} | Edit Issue #${issueId} in Project #${projectId}`,
            userid,
            admin,
            path: "/projects",
            projectPath: "/issues",
            issueId,
            projectId,
            projectName,
            forms,
            submit: "Update",
            pathLib: path
          });
        })
        .catch(e => res.render("error", { message: "Error", error: e }));
    };
  },

  update(pool, limit = 2) {
    return (req, res) => {
      const { projectId, issueId } = req.params;
      const { userid } = req.session.user;
      const keys = Object.keys(req.body);
      const keysOldValue = keys.filter(key => key.match(/(OldValue)$/));
      const keysNewValue = keys.filter(key => !key.match(/(OldValue)$/));
      const oldValues = keysOldValue.reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});
      // filtering all new values that differ from the related old value
      let newValues = keysNewValue.reduce((obj, key) => {
        if (oldValues[`${key}OldValue`] !== req.body[key])
          obj[key] = req.body[key];
        return obj;
      }, {});

      if (req.files) {
        // delete old file
        fs.unlinkSync(
          path.join(
            __dirname,
            "..",
            "public",
            ...oldValues.filesOldValue.split("/").slice(1)
          )
        );
        let file = req.files.files;
        const { fileName, filePath } = createFileName(file.name, projectId);
        newValues.files = `/uploaded/${fileName}`;
        file.mv(filePath, e => {
          if (e) res.render("error", { message: "Error", error: e });
        });
      }

      if (newValues.startdate) {
        newValues.startdate = convertDate(newValues.startdate);
      }
      if (newValues.duedate) {
        newValues.duedate = convertDate(newValues.duedate);
      }

      let closed = newValues.status == "Closed";
      let tracker = oldValues.trackerOldValue;
      let subject = newValues.subject || oldValues.subjectOldValue;
      let status = newValues.status || oldValues.statusOldValue;
      console.log(status);

      const issue = new Issue(pool, projectId, limit);
      const activity = new Activity(
        pool,
        projectId,
        userid,
        issueId,
        tracker,
        subject,
        status
      );

      issue
        .update(newValues, issueId, closed)
        .then(message => {
          req.flash("notifAlert", message);
          // save to activities table and redirect to the page where the issue is located
          issue.conditional += ` AND i1.issueid <= ${issueId}`;
          const getPageNum = issue.countPage();
          const saveActivity = activity.describe(oldValues, newValues).save();
          Promise.all([getPageNum, saveActivity])
            .then(results => {
              const pageNum = results[0];
              res.redirect(`/projects/issues/${projectId}?page=${pageNum}`);
            })
            .catch(e => res.render("error", { message: "Error", error: e }));
        })
        .catch(e => res.render("error", { message: "Error", error: e }));
    };
  },

  del(pool, limit = 2) {
    return (req, res) => {
      const { projectId, issueId } = req.params;
      const { userid } = req.session.user;
      const issues = new Issue(pool, projectId, limit);
      const getIssue = issues.getConditionals({ issueid: issueId }).find();
      getIssue.then(result => {
        const { tracker, subject, status, files } = result.rows[0];
        if (status == "Closed") {
          // this issue can not be deleted
          req.flash(
            "warningAlert",
            `Issue #${issueId} has been closed, so it could not be deleted.`
          );
          res.redirect(`/projects/issues/${projectId}`);
        } else {
          // delete file
          fs.unlinkSync(
            path.join(__dirname, "..", "public", ...files.split("/").slice(1))
          );
          /* delete this issue, save activity, and redirect to the page 
          where the issue is located or to the last page*/
          issues.conditional += ` AND issueid <= ${issueId}`;
          issues.countPage().then(pageNum => {
            const deleteIssue = issues.del(issueId);
            const activity = new Activity(
              pool,
              projectId,
              userid,
              issueId,
              tracker,
              subject,
              status
            );
            activity.description = "Deleted.";
            const saveActivity = activity.save();
            Promise.all([deleteIssue, saveActivity]).then(() => {
              // get the last page
              issues.conditional = `WHERE i1.projectid = ${projectId}`;
              issues.countPage().then(lastPage => {
                if (pageNum > lastPage) pageNum = lastPage;
                res.redirect(`/projects/issues/${projectId}?page=${pageNum}`);
              });
            });
          });
        }
      });
    };
  }
};
