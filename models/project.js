// new method for string object to convert string to number or string with double quotes
// String.prototype.convert = function() {
//   if (this == "undefined" || this == "") return `''`;
//   if (Number(this).toString() !== "NaN") return Number(this);
//   return `'${this}'`;
// };

module.exports = class Project {
  constructor(pool, userid, admin, limit = 2) {
    this.pool = pool;
    this.userid = userid;
    this.admin = admin;
    this.limit = limit;
    this.sqlPart =
      "FROM users INNER JOIN members ON members.userid = users.userid INNER JOIN projects proj ON proj.projectid = members.projectid";
  }

  getConditional(constraints = {}) {
    // if the user is not admin, the user can see his/her projects only
    if (!this.admin) constraints.userid = this.userid;

    let conditionals = [];
    let userQuery, subsubquery, subquery;

    if (constraints.userid) {
      if (constraints.userid.toString().trim().length > 0) {
        subsubquery = `SELECT projectid FROM members WHERE userid = ${constraints.userid}`;
        subquery = `SELECT userid FROM members WHERE projectid IN ( ${subsubquery} )`;
        conditionals.push(
          `users.userid IN ( ${subquery} ) AND proj.projectid IN ( ${subsubquery} )`
        );
      }
    }

    if (constraints.memberName) {
      if (constraints.memberName.trim().length > 0) {
        userQuery = `SELECT userid FROM users WHERE LOWER(concat(firstname, ' ', lastname)) = LOWER('${constraints.memberName}')`;
        subsubquery = `SELECT projectid FROM members WHERE userid IN ( ${userQuery} )`;
        subquery = `SELECT userid FROM members WHERE projectid IN ( ${subsubquery} )`;
        conditionals.push(
          `users.userid IN ( ${subquery} ) AND proj.projectid IN ( ${subsubquery} )`
        );
      }
    }

    if (constraints.projectId) {
      if (constraints.projectId.toString().trim().length > 0)
        conditionals.push(`proj.projectid = ${constraints.projectId}`);
    }

    if (constraints.projectName) {
      if (constraints.projectName.trim().length > 0) {
        conditionals.push(
          `LOWER(proj.projectname) LIKE '%${constraints.projectName
            .toLowerCase()}%'`
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
    const pg = {
      id: "proj.projectid",
      name: "proj.projectname",
      member: `string_agg(concat(users.firstname, ' ', users.lastname), ', ') member`
    };
    const colPg = columns.map(col => pg[col]);

    let sql = `SELECT ${colPg.join(", ")} ${this.sqlPart} ${this.conditional}`;
    const offsetStr = offset == 0 ? "" : `OFFSET ${offset}`;
    sql += ` GROUP BY proj.projectid ORDER BY proj.projectid LIMIT ${this.limit} ${offsetStr}`;

    return this.pool.query(sql);
  }

  getAllMember() {
    let sql = `SELECT concat(users.firstname, ' ', users.lastname) member
    FROM users 
    INNER JOIN members ON members.userid = users.userid
    GROUP BY users.userid ORDER BY users.userid`;

    return this.pool.query(sql);
  }
};
