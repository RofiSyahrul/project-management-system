module.exports = class Activity {
  constructor(
    pool,
    projectId = 1,
    author = 1,
    issueId = 1,
    tracker = "",
    subject = "",
    status = ""
  ) {
    this.pool = pool;
    this.projectId = projectId;
    this.author = author;
    this.title = `[${tracker}] ${subject} #${issueId} (${status})`;
    this.description = "";
  }

  describe(oldValues = {}, newValues = {}) {
    if (newValues == {}) return this;
    const labels = ["Done (%)", "Spent time (hours)"];
    ["done", "spenttime"].forEach((key, i) => {
      let value = "no change. ";
      if (newValues[key])
        value = `${oldValues[key + "OldValue"]} --> ${newValues[key]}. `;
      this.description += `${labels[i]}: ${value}`;
    });
    return this;
  }

  save() {
    return new Promise((resolve, reject) => {
      if (this.description.length == 0) resolve("");
      else {
        let sql = `INSERT INTO activities (time, title, description, author, projectid)
        VALUES (NOW(), $1, $2, $3, $4)`;
        this.pool
          .query(sql, [
            this.title,
            this.description,
            this.author,
            this.projectId
          ])
          .then(() => resolve(""))
          .catch(e => reject(e));
      }
    });
  }

  countPages(daysLimit = 2) {
    return new Promise((resolve, reject) => {
      let sql = `SELECT COUNT(DISTINCT time::date) FROM activities`;
      sql += ` WHERE projectid = ${this.projectId}`;
      this.pool
        .query(sql)
        .then(result => {
          resolve(Math.ceil(result.rows[0].count / daysLimit));
        })
        .catch(e => reject(e));
    });
  }

  find(daysLimit = 2, offset = 0) {
    let subquery = `SELECT DISTINCT (time AT TIME ZONE 'Asia/Jakarta' AT TIME ZONE 'utc')::DATE FROM activities`;
    subquery += ` ORDER BY time DESC LIMIT ${daysLimit} OFFSET ${offset}`;

    let sql = `SELECT (time AT TIME ZONE 'Asia/Jakarta' AT TIME ZONE 'utc')::DATE AS date`;
    sql += `, (time AT TIME ZONE 'Asia/Jakarta' AT time zone 'utc')::time as time`;
    sql += `, title, description, CONCAT(firstname, ' ', lastname) author_name, projectname`;
    sql += ` FROM activities, users, projects`;
    sql += ` WHERE author = userid AND activities.projectid = projects.projectid`;
    sql += ` AND activities.projectid = ${this.projectId}`;
    sql += ` AND (time AT TIME ZONE 'Asia/Jakarta' AT TIME ZONE 'utc')::DATE IN (${subquery})`;
    sql += ` ORDER BY activities.time DESC`;

    return this.pool.query(sql);
  }
};
