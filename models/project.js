module.exports = class Project {
  constructor(pool, userid, admin, limit = 2) {
    this.pool = pool;
    this.userid = userid;
    this.admin = admin;
    this.limit = limit;
    this.conditional = "";
    this.sqlPart =
      "FROM users INNER JOIN members ON members.userid = users.userid INNER JOIN projects proj ON proj.projectid = members.projectid";
  }

  createSubquery(userid) {
    const subsubquery = `SELECT projectid FROM members WHERE userid = ${userid}`;
    const subquery = `SELECT userid FROM members WHERE projectid IN ( ${subsubquery} )`;
    return { subsubquery, subquery };
  }

  getConditional(constraints = {}) {
    let conditionals = [];

    // if the user is not admin, the user can see his/her projects only
    if (!this.admin) {
      const { subsubquery, subquery } = this.createSubquery(this.userid);
      conditionals.push(
        `users.userid IN ( ${subquery} ) AND proj.projectid IN ( ${subsubquery} )`
      );
    }

    if (constraints.userId) {
      const { subsubquery, subquery } = this.createSubquery(constraints.userId);
      conditionals.push(
        `users.userid IN ( ${subquery} ) AND proj.projectid IN ( ${subsubquery} )`
      );
    }

    if (constraints.projectId) {
      if (constraints.projectId.toString().trim().length > 0)
        conditionals.push(`proj.projectid = ${constraints.projectId}`);
    }

    if (constraints.projectName) {
      if (constraints.projectName.trim().length > 0) {
        conditionals.push(
          `LOWER(proj.projectname) LIKE '%${constraints.projectName.toLowerCase()}%'`
        );
      }
    }

    if (conditionals.length > 0)
      this.conditional = ` WHERE ${conditionals.join(" AND ")}`;
    else this.conditional = "";

    return this;
  }

  countPages() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT COUNT(DISTINCT proj.projectid) nums ${this.sqlPart} ${this.conditional}`;
      this.pool.query(sql, (err, res) => {
        if (err) reject(err);
        else {
          resolve(Math.ceil(res.rows ? res.rows[0].nums / this.limit : 0));
        }
      });
    });
  }

  find(columns = ["id", "name", "member"], offset = 0) {
    if (!(arguments[0] instanceof Array) && arguments.length == 1) {
      columns = ["id", "name", "member"];
      offset = arguments[0];
    }
    const pg = {
      id: "proj.projectid",
      name: "proj.projectname",
      member: `string_agg(concat(users.firstname, ' ', users.lastname), ', ' ORDER BY users.firstname) member`
    };
    const colPg = columns.map(col => pg[col]);

    let sql = `SELECT ${colPg.join(", ")} ${this.sqlPart} ${this.conditional}`;
    const offsetStr = offset == 0 ? "" : `OFFSET ${offset}`;
    sql += ` GROUP BY proj.projectid ORDER BY proj.projectid LIMIT ${this.limit} ${offsetStr}`;

    return this.pool.query(sql);
  }

  static getMembers(pool, projectId) {
    let conditional = "";
    if (projectId) {
      conditional = `INNER JOIN members USING (userid) WHERE projectid = ${projectId}`;
    }
    let sql = `SELECT userid, CONCAT(firstname, ' ', lastname) member FROM users ${conditional}
    ORDER BY firstname`;
    return pool.query(sql);
  }

  insertMember(projectId = 1, usersId = []) {
    if (!(usersId instanceof Array)) usersId = [usersId];
    const values = usersId
      .map(userId => `(${projectId}, ${userId})`)
      .join(", ");
    const sql = `INSERT INTO members (projectid, userid) VALUES ${values}`;
    return this.pool.query(sql);
  }

  save(name = "", usersId = []) {
    return new Promise((resolve, reject) => {
      if (usersId == undefined || name == "") resolve("No projects added");
      else {
        const sqlAddProject = `INSERT INTO projects (projectname) VALUES ($1)`;
        this.pool
          .query(sqlAddProject, [name])
          .then(() => {
            this.pool
              .query(`SELECT MAX(projectid) FROM projects`)
              .then(result => {
                const maxId = Number(result.rows[0].max);
                this.insertMember(maxId, usersId)
                  .then(() => {
                    resolve(`Project '${name}' has been added`);
                  })
                  .catch(e => reject(e));
              })
              .catch(e => reject(e));
          })
          .catch(e => reject(e));
      }
    });
  }

  update(projectId = 1, name = "", usersId = []) {
    return new Promise((resolve, reject) => {
      if (usersId == undefined || name == "") {
        resolve(`Project #${projectId} is not updated`);
      } else {
        const sqlProject = `UPDATE projects SET projectname = $1 WHERE projectid = $2`;
        const sqlDelMember = `DELETE FROM members WHERE projectid = $1`;
        const updateProject = this.pool.query(sqlProject, [name, projectId]);
        const deleteMember = this.pool.query(sqlDelMember, [projectId]);
        Promise.all([updateProject, deleteMember])
          .then(() => {
            this.insertMember(projectId, usersId)
              .then(() => {
                resolve(`Project #${projectId} has been updated`);
              })
              .catch(e => reject(e));
          })
          .catch(e => reject(e));
      }
    });
  }

  del(projectId = 1) {
    const sql = "DELETE FROM projects WHERE projectid = $1";
    return this.pool.query(sql, [projectId]);
  }
};
