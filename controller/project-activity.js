const moment = require("moment");
const Activity = require("../models/activity");

function convertDateTerm(date) {
  date = moment(date).format("YYYY-MM-DD");
  const today = moment().format("YYYY-MM-DD");
  const yesterday = moment()
    .subtract(1, "days")
    .format("YYYY-MM-DD");
  if (date == today) {
    return "Today";
  } else if (date == yesterday) {
    return "Yesterday";
  }
  return moment(date).format("MMMM Do, YYYY");
}

module.exports = {
  view(pool, daysLimit = 2) {
    return (req, res) => {
      const { projectId } = req.params;
      const { userid, admin, nickname } = req.session.user;
      const current = Number(req.query.page || 1);

      let url1 = req.originalUrl;
      let url = url1.includes("page") ? url1 : `${url1}?page=${current}`;
      let title = `${nickname} | Activities in Project #${projectId}`;
      title += admin ? " | Admin" : "";

      const activities = new Activity(pool, projectId);
      const countPages = activities.countPages(daysLimit);
      const findActivities = activities.find(
        daysLimit,
        (current - 1) * daysLimit
      );

      Promise.all([countPages, findActivities])
        .then(results => {
          const numOfPages = results[0];

          let data = results[1].rows;
          data = data.map(item => {
            item.date = moment(item.date).format("YYYY-MM-DD");
            return item;
          });
          let dates = data.map(item => item.date);
          dates = dates.filter(
            (date, index, arr) => arr.indexOf(date) == index
          );
          console.log(dates);
          let actsPerDate = dates.map(date => {
            let dataInDate = data.filter(item => item.date == date);
            dataInDate = dataInDate.map(item => {
              item.time = moment(item.time, "HH:mm:ss.SSS").format("HH:mm:ss");
              return item;
            });
            return {
              date: convertDateTerm(date),
              data: dataInDate
            };
          });

          res.render("projects/activity/view", {
            title,
            path: "/projects",
            projectPath: "/activity",
            projectId,
            userid,
            admin,
            url1,
            url,
            current,
            numOfPages,
            actsPerDate
          });
        })
        .catch(e => res.render("error", { message: "Error", error: e }));
    };
  }
};
