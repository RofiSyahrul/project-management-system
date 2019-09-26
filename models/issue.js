module.exports = class Issue {
  constructor(pool, projectId = 1) {
    this.pool = pool;
    this.projectId = projectId;
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

  
};
