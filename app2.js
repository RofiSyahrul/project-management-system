const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const { Pool } = require("pg");
const session = require("express-session");
const fileUpload = require("express-fileupload");
const flash = require("connect-flash");

const loginRouter = require("./routes/login");
const projectsRouter = require("./routes/projects");
const profileRouter = require("./routes/profile");
const usersRouter = require("./routes/users");

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(flash());
app.set("etag", false);
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "pmsdb",
  password: "12345",
  port: 5432
});


const sess = {
  secret: "test",
  resave: true,
  cookie: {},
  saveUninitialized: true
};

app.use(session(sess));
app.use(fileUpload());
app.use("/", loginRouter(pool));
app.use("/projects", projectsRouter(pool));
app.use("/profile", profileRouter(pool));
app.use("/users", usersRouter(pool));

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;