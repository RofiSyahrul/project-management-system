module.exports = class User{

  constructor(pool, email, firstname, lastname, position, fulltime, admin){
    this.pool = pool;
    this.email = email;
    this.firstname = firstname;
    this.lastname = lastname;
    this.position = position;
    this.fulltime = fulltime;
    this.admin = admin;
  }

  find(){
    return this.pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)',[this.email]);
  }
}