const Project = require("../models/project");
function restrictedAccess (res, userid, admin, nickname){
  res.render("restricted-access", {
    title: `${nickname} | Restricted Access`,
    projectPath: "",
    path: "",
    userid,
    admin
  });
}

module.exports = pool => {
  return (req, res, next) => {
    const { projectId } = req.params;
    const { userid, admin, nickname } = req.session.user;
    const url = req.originalUrl;
    if (projectId) {
      const project = new Project(pool, userid, admin);
      project
        .getConditional({ projectId })
        .countPages()
        .then(result => {
          if (result === 0 || (url.includes("/projects/delete") && !admin)) {
            // the user can't access the desired page
            restrictedAccess(res, userid, admin, nickname);
          } else next();
        });
    } else {
      const restrictedUrl = ["/projects/add", "/users"];
      if (restrictedUrl.includes(url) && !admin) {
        // the user can't access the desired page
        restrictedAccess(res, userid, admin, nickname);
      } else next();
    }
  };
};
