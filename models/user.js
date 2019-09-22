module.exports = class User {
  constructor(pool, email) {
    this.pool = pool;
    this.email = email;
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
};
