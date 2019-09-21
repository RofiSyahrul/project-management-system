module.exports = {
  countPages: (pool, tableName = "", conditional = "", limit = 3) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT COUNT(${tableName}.*) AS nums FROM ${tableName} ${conditional}`;
      pool.query(sql, (err, res) => {
        if (err) reject(err);
        else {
          resolve(Math.ceil(res.rows ? res.rows[0].nums / limit : 0));
        }
      });
    });
  },

  parseDate: date => {
    if (date.length === 0 || date == "Infinity") return "kosong";
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember"
    ];
    date = new Date(date);
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  },

  checkAuth: (req,res,next) => {
    if (req.session.user)  next();
    else res.render('login', {loginAlert: req.flash('loginAlert')[0]});
  }
};
