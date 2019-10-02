module.exports = class Issue {
  constructor(pool, projectId = 1, limit = Infinity) {
    this.pool = pool;
    this.projectId = projectId;
    this.limit = limit;
    this.sql = `SELECT i1.issueid, i1.tracker, i1.subject, i1.description, i1.status, 
    i1.priority, i1.assignee, CONCAT(u1.firstname, ' ', u1.lastname) assignee_name,
    i1.startdate, i1.duedate, i1.estimatedtime, i1.done, i1.files, i1.spenttime,
    i1.targetversion, i1.author, CONCAT (u2.firstname, ' ', u2.lastname) author_name,
    i1.createddate, i1.updateddate, i1.closeddate, i1.parenttask, i2.subject parent_task
    FROM issues i1
    LEFT JOIN users u1 ON i1.assignee = u1.userid
    LEFT JOIN users u2 ON i1.author = u2.userid
    LEFT JOIN issues i2 ON i1.parenttask = i2.issueid`;
    this.conditional = `WHERE i1.projectid = ${this.projectId}`;
  }

  count(status = "all") {
    let sql = `SELECT tracker, COUNT(tracker), max(projectname) projectname 
    FROM projects LEFT OUTER JOIN issues USING (projectid)
    WHERE projectid = $1`;
    let constraints = [this.projectId];
    if (status.toLocaleLowerCase() === "open") {
      sql += ` AND status != $2`;
      constraints.push("Closed");
    }
    sql += ` GROUP BY tracker ORDER BY tracker`;
    return this.pool.query(sql, constraints);
  }

  getProjectName() {
    const sql = `SELECT projectname FROM projects WHERE projectid = $1`;
    return this.pool.query(sql, [this.projectId]);
  }

  getConditionals(constraints = {}) {
    const allFiltersNum = ["issueid", "assignee", "done"];
    const allFiltersStr = [
      "tracker",
      "subject",
      "status",
      "priority",
      "startdate",
      "duedate"
    ];

    let conditionals = [];
    allFiltersNum.forEach(filter => {
      if (constraints[filter]) {
        if (constraints[filter].toString().trim().length > 0) {
          conditionals.push(`i1.${filter} = ${constraints[filter]}`);
        }
      }
    });
    allFiltersStr.forEach(filter => {
      if (constraints[filter]) {
        if (constraints[filter].toString().trim().length > 0) {
          if (filter == "subject") {
            conditionals.push(`i1.${filter} ILIKE '%${constraints[filter]}%'`);
          } else {
            conditionals.push(`i1.${filter} = '${constraints[filter]}'`);
          }
        }
      }
    });

    if (conditionals.length > 0)
      this.conditional += ` AND ${conditionals.join(" AND ")}`;

    return this;
  }

  countPage() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT COUNT(*) FROM issues i1 ${this.conditional}`;
      this.pool
        .query(sql)
        .then(res => {
          if (this.limit == Infinity) resolve(res.rows ? 1 : 0);
          else
            resolve(Math.ceil(res.rows ? res.rows[0].count / this.limit : 0));
        })
        .catch(e => reject(e));
    });
  }

  find(offset = 0) {
    const limitStr = this.limit == Infinity ? "" : ` LIMIT ${this.limit}`;
    const offsetStr = offset <= 0 ? "" : ` OFFSET ${offset}`;
    const sql = `${this.sql} ${this.conditional} ORDER BY issueid${limitStr}${offsetStr}`;
    return this.pool.query(sql);
  }

  save(data = {}) {
    const colNames = Object.keys(data);
    const values = Object.values(data);
    let sql = `INSERT INTO issues (
      ${colNames.join(", ")}, createddate, updateddate
    ) VALUES (
      ${colNames.map((col, i) => "$" + Number(i + 1)).join(", ")}, NOW(), NOW()
    )`;
    return this.pool.query(sql, values);
  }

  getAllIssuesId(except) {
    let sql = `SELECT issueid, subject FROM issues WHERE projectid = ${this.projectId}`;
    if (except) sql += `  AND issueid != ${except}`;
    return this.pool.query(sql);
  }

  update(data = {}, issueid = 1, closed = false) {
    return new Promise((resolve, reject) => {
      if (data == {}) resolve(`No updates on issue #${issueid}`);
      else {
        const colNames = Object.keys(data);
        const columns = colNames
          .map((col, i) => `${col} = $${i + 1}`)
          .join(", ");
        const values = Object.values(data);
        let sql = `UPDATE issues SET ${columns}, updateddate = NOW()`;
        if (closed) sql += `, closeddate = NOW()`;
        sql += ` WHERE issueid = ${issueid}`;
        this.pool
          .query(sql, values)
          .then(() => {
            resolve(
              `Issue #${issueid} has been updated with change on ${colNames.join(
                ", "
              )} column(s)`
            );
          })
          .catch(e => reject(e));
      }
    });
  }

  del(issueid = 1){
    let sql = `DELETE FROM issues WHERE issueid = ${issueid}`;
    return this.pool.query(sql);
  }
};
