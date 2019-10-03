const Issue = require("../models/issue");
const Project = require("../models/project");

function getCountResult(issues = [], tracker = "Bug") {
  let filteredIssue = issues.filter(issue => issue.tracker == tracker);
  if (filteredIssue.length == 0) return 0;
  return filteredIssue[0].count;
}

module.exports = pool => {
  return (req, res) => {
    const { projectId } = req.params;
    const { userid, admin, nickname } = req.session.user;
    const adminSign = admin ? " | Admin" : "";
    const issue = new Issue(pool, projectId);
    const getIssues = [issue.count("open"), issue.count()];
    const getMembersIn = Project.getMembers(pool, projectId);
    Promise.all([...getIssues, getMembersIn])
      .then(results => {
        let openIssues = results[0].rows;
        let allIssues = results[1].rows;
        let projectName = allIssues[0].projectname;
        let trackers = ["Bug", "Feature", "Support"];
        let issues = trackers.map(tracker => {
          return {
            tracker,
            open: getCountResult(openIssues, tracker),
            all: getCountResult(allIssues, tracker)
          };
        });
        let members = results[2].rows.map(item => item.member);
        res.render("projects/overview/view", {
          title: `${nickname} | Overview Project #${projectId}${adminSign}`,
          path: "/projects",
          projectPath: "/overview",
          projectId,
          userid,
          admin,
          project: projectName,
          issues,
          members
        });
      })
      .catch(e => res.render("error", { message: "Error", error: e }));
  };
};
