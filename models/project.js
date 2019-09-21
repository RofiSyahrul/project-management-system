// new method for string object to convert string to number or string with double quotes
String.prototype.convert = function() {
  if (this == "undefined" || this == "") return `''`;
  if (Number(this).toString() !== "NaN") return Number(this);
  return `'${this}'`;
};

module.exports = class Project {
  constructor(userid, admin) {
    this.userid = userid;
    this.admin = admin;
  }

  find(columns = ["id", "name", "member"], constraints = {}) {
    // if the user is not admin, the user can see his/her projects only
    if (!this.admin) constraints.userid = this.userid;

    const pg = {
      id: "proj.projectid",
      name: "proj.projectname",
      member: `string_agg(concat(users.firstname, ' ', users.lastname), ', ') member`
    };
    const colPg = columns.map(col => pg[col]);

    let sql = `SELECT ${colPg.join(
      ", "
    )} FROM users INNER JOIN members ON members.userid = users.userid INNER JOIN projects proj ON proj.projectid = members.projectid`;

    let conditionals = [];
    let userQuery, subsubquery, subquery;
    if (constraints.userid) {
      subsubquery = `SELECT projectid FROM members WHERE userid = ${constraints.userid}`;
      subquery = `SELECT userid FROM members WHER projectid IN ( ${subsubquery} )`;
      conditionals.push(
        `users.userid IN ( ${subquery} ) AND proj.projectid IN ( ${subsubquery} )`
      );
    }

    if (constraints.memberName) {
      userQuery = `SELECT userid FROM users WHERE LOWER(concat(firstname, ' ', lastname)) = LOWER(${constraints.memberName.convert()})`;
      subsubquery = `SELECT projectid FROM members WHERE userid IN ( ${userQuery} )`;
      subquery = `SELECT userid FROM members WHERE projectid IN ( ${subsubquery} )`;
      conditionals.push(
        `users.userid IN ( ${subquery} ) AND proj.projectid IN ( ${subsubquery} )`
      );
    }

    if (constraints.projectId) {
      conditionals.push(`proj.projectid = ${constraints.projectId}`);
    }

    if (constraints.projectName) {
      conditionals.push(
        `LOWER(proj.projectname) LIKE %${constraints.projectName
          .toLowerCase()
          .convert()}%`
      );
    }
  }
};
