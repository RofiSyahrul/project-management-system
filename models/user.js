module.exports = class User {
  constructor(pool, email, limit = Infinity) {
    this.pool = pool;
    this.email = email;
    this.limit = limit;
    this.conditional = "";
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
    const sql = `UPDATE users SET ${colStr} WHERE userid = $${columns.length +
      1}`;
    return pool.query(sql, [...values, userid]);
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
      this.conditional = `WHERE ${conditionals.join(" AND ")}`;

    return this;
  }

  countPage() {
    return new Promise((resolve, reject) => {
      let sql = `SELECT COUNT(*) FROM users ${this.conditional}`;
      let query =
        this.conditional.length > 0
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
      this.conditional.length > 0
        ? this.pool.query(sql, this.arrConditionals)
        : this.pool.query(sql);
    return query;
  }
};
