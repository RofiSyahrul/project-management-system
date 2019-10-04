const bcrypt = require("bcrypt");

module.exports = class User {
  constructor(pool, email, limit = Infinity) {
    this.pool = pool;
    this.email = email;
    this.limit = limit;
    this.conditional = "WHERE userid != 1";
    this.arrConditionals = [];
  }

  find() {
    return this.pool.query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
      [this.email]
    );
  }

  static findById(pool, userid = 1) {
    return pool.query("SELECT * FROM users WHERE userid = $1", [userid]);
  }

  static editProfile(pool, values = [], userid = 1) {
    const columns = [
      "password",
      "firstname",
      "lastname",
      "position",
      "fulltime"
    ];
    const colStr = columns.map((col, i) => `${col} = $${i + 1}`).join(", ");
    const sql = `UPDATE users SET ${colStr} WHERE userid = ${userid}`;
    values[0] = bcrypt.hashSync(values[0], 10);
    return pool.query(sql, values);
  }

  static updateOpt(pool, column = "", value = {}, userid = 1) {
    return pool.query(`UPDATE users SET ${column} = $1 WHERE userid = $2`, [
      value,
      userid
    ]);
  }

  static getUsers(pool, userid) {
    let conditional = "";
    if (userid) conditional = `WHERE userid = ${userid}`;
    let sql = `SELECT userid, CONCAT(firstname, ' ', lastname) fullname`;
    sql += ` FROM users ${conditional} ORDER BY firstname`;
    return pool.query(sql);
  }

  getConditionals(constraints = {}) {
    let colNames = Object.keys(constraints);
    colNames = colNames.filter(col => constraints[col] != undefined);

    let conditionals = [];
    colNames.forEach((col, i) => {
      if (col == "fullname") {
        conditionals.push(`CONCAT(firstname, ' ', lastname) ILIKE $${i + 1}`);
        this.arrConditionals.push(`%${constraints.fullname}%`);
      } else if (["nickname", "email"].includes(col)) {
        conditionals.push(`${col} ILIKE $${i + 1}`);
        this.arrConditionals.push(`%${constraints[col]}%`);
      } else {
        conditionals.push(`${col} = $${i + 1}`);
        this.arrConditionals.push(constraints[col]);
      }
    });

    if (conditionals.length > 0)
      this.conditional += ` AND ${conditionals.join(" AND ")}`;

    return this;
  }

  countPage() {
    return new Promise((resolve, reject) => {
      let sql = `SELECT COUNT(*) FROM users ${this.conditional}`;
      let query =
        this.arrConditionals.length > 0
          ? this.pool.query(sql, this.arrConditionals)
          : this.pool.query(sql);
      query
        .then(res => {
          if (this.limit == Infinity) resolve(res.rows ? 1 : 0);
          else {
            resolve(Math.ceil(res.rows ? res.rows[0].count / this.limit : 0));
          }
        })
        .catch(e => reject(e));
    });
  }

  findAll(offset = 0) {
    const limitStr = this.limit == Infinity ? "" : `LIMIT ${this.limit}`;
    let sql = `SELECT userid, CONCAT(firstname, ' ', lastname) fullname, nickname`;
    sql += `, email, position, fulltime FROM users ${this.conditional}`;
    sql += ` ORDER BY userid ${limitStr} OFFSET ${offset}`;
    let query =
      this.arrConditionals.length > 0
        ? this.pool.query(sql, this.arrConditionals)
        : this.pool.query(sql);
    return query;
  }

  save(data = {}) {
    if (data.password) {
      data.password = bcrypt.hashSync(data.password, 10);
    }
    const colNames = Object.keys(data);
    const values = Object.values(data);
    const issueOpt = {
      issueid: true,
      tracker: true,
      subject: true,
      description: false,
      status: true,
      priority: true,
      assignee: true,
      startdate: true,
      duedate: true,
      estimatedtime: false,
      done: true,
      files: false,
      spenttime: false,
      targetversion: false,
      author: true,
      createddate: false,
      updateddate: true,
      closeddate: false,
      parenttask: false
    };
    let sql = `INSERT INTO users (
      ${colNames.join(", ")}, issueopt
    ) VALUES (
      ${colNames
        .map((col, i) => "$" + Number(i + 1))
        .join(", ")}, $${colNames.length + 1}
    )`;
    return this.pool.query(sql, [...values, issueOpt]);
  }

  update(data = {}, userid = 1) {
    const objLabels = {
      firstname: "first name",
      lastname: "last name",
      nickname: "nickname",
      password: "password",
      position: "position",
      fulltime: "job type"
    };
    return new Promise((resolve, reject) => {
      if (Object.keys(data).length == 0)
        resolve(`No updates on user #${userid}`);
      else {
        console.log(data);
        if (data.password) data.password = bcrypt.hashSync(data.password, 10);
        const colNames = Object.keys(data);
        const arrLabels = colNames.map(col => objLabels[col]);
        const columns = colNames
          .map((col, i) => `${col} = $${i + 1}`)
          .join(", ");
        const values = Object.values(data);
        let sql = `UPDATE users SET ${columns} WHERE userid = ${userid}`;
        this.pool
          .query(sql, values)
          .then(() => {
            resolve(
              `User #${userid} has been updated with change on ${arrLabels.join(
                ", "
              )}`
            );
          })
          .catch(e => reject(e));
      }
    });
  }

  del(userid = 100) {
    return this.pool.query(`DELETE FROM users WHERE userid = ${userid}`);
  }
};
