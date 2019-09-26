module.exports = class Member {
  constructor(pool, projectId, limit = Infinity) {
    this.pool = pool;
    this.projectId = projectId;
    this.limit = limit;
    this.sqlPart = `FROM members INNER JOIN users USING (userid)`;
    this.conditional = `WHERE projectid = ${this.projectId}`;
  }

  getProjectName() {
    const sql = `SELECT projectname FROM projects WHERE projectid = $1`;
    return this.pool.query(sql, [this.projectId]);
  }

  getConditional(constraints = {}) {
    const { userid, fullname, role } = constraints;
    let conditionals = [];

    if (userid) {
      if (userid.toString().trim().length > 0) {
        conditionals.push(`userid = ${userid}`);
      }
    }

    if (fullname) {
      conditionals.push(
        `CONCAT(firstname, ' ', lastname) ILIKE '%${fullname}%'`
      );
    }

    if (role) conditionals.push(`role = '${role}'`);

    if (conditionals.length > 0)
      this.conditional += ` AND ${conditionals.join(" AND ")}`;

    return this;
  }

  countPage() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT COUNT(*) ${this.sqlPart} ${this.conditional}`;
      this.pool.query(sql, (err, res) => {
        if (err) reject(err);
        else if (this.limit === Infinity) resolve(res.rows ? 1 : 0);
        else {
          resolve(Math.ceil(res.rows ? res.rows[0].count / this.limit : 0));
        }
      });
    });
  }

  find(columns = ["userid", "fullname", "role"], offset = 0) {
    const pg = {
      userid: "userid",
      fullname: `CONCAT(firstname, ' ', lastname) fullname`,
      role: "role"
    };
    const colPg = columns.map(col => pg[col]);
    let orderBy = "ORDER BY userid";
    if (!columns.includes("userid") && columns.includes("fullname")) {
      orderBy = "ORDER BY firstname";
    } else if (!columns.includes("userid") && columns.includes("role")) {
      orderBy = "ORDER BY role";
    }
    const limitStr = this.limit === Infinity ? "" : ` LIMIT ${this.limit}`;
    const offsetStr = offset === 0 ? "" : ` OFFSET ${offset}`;
    const sql = `SELECT ${colPg.join(", ")} ${this.sqlPart} ${this.conditional} 
    ${orderBy}${limitStr}${offsetStr}`;
    return this.pool.query(sql);
  }

  save(userid = 1, role = "", fullname = "") {
    return new Promise((resolve, reject) => {
      if (userid == "" || role == undefined)
        resolve(`No members added to project #${this.projectId}`);
      else {
        let sql = `INSERT INTO members (userid, role, projectid) VALUES ($1, $2, $3)`;
        this.pool
          .query(sql, [userid, role, this.projectId])
          .then(() => {
            resolve(
              `${fullname} has been assigned as ${role} for project #${this.projectId}`
            );
          })
          .catch(e => reject(e));
      }
    });
  }

  update(userid = 1, oldRole = "", newRole = "", fullname = "") {
    return new Promise((resolve, reject) => {
      if (newRole == undefined || newRole == oldRole)
        resolve(`No update role for ${fullname} in project #${this.projectId}`);
      else {
        let sql = `UPDATE members SET role = $1 WHERE projectid = $2 AND userid = $3`;
        this.pool
          .query(sql, [newRole, this.projectId, userid])
          .then(() => {
            resolve(
              `${fullname}'s role has been updated to ${newRole} in project #${this.projectId}`
            );
          })
          .catch(e => reject(e));
      }
    });
  }

  del(userid = 1){
    const sql = `DELETE FROM members WHERE projectid = $1 AND userid = $2`;
    return this.pool.query(sql, [this.projectId, userid]);
  }
};
