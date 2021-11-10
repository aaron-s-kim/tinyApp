const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

const app = express();
const PORT = 8080; // default port 8080

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs"); // sets EJS as template view engine, checks views dir

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  S152tx: "https://www.tsn.ca",
};

// PAGE - Root
app.get("/", (req, res) => {
  res.send("Hello!");
});

// PAGE - Main URLs Index
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

// PAGE - Create New shortURL; should be defined before GET /urls/:id
app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});
// ADD - adds new shortURL: longURL
app.post("/urls", (req, res) => {
  const randShortURL = generateRandomString();
  urlDatabase[randShortURL] = req.body.longURL;
  res.redirect(`/urls/${randShortURL}`);
});

// EDIT - edit a longURL
app.post("/urls/:shortURL", (req, res) => {
  const shortKey = req.params.shortURL;
  const longVal = req.body.longURL;
  urlDatabase[shortKey] = longVal;
  res.redirect("/urls");
});
// DELETE - delete a shortURL: longURL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortKey = req.params.shortURL;
  delete urlDatabase[shortKey];
  res.redirect("/urls");
});

// PAGE - Individual shortURL
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"],
  };

  if (!urlDatabase.hasOwnProperty(req.params.shortURL)) {
    res.redirect("/not_found");
  } else {
    res.render("urls_show", templateVars);
  }
});

// Login
app.post("/login", (req, res) => {
  // console.log('Cookies:', req.cookies); // cookies that have not been signed
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

// Logout
app.post("/logout", (req, res) => {
  res.clearCookie("username"); // clear cookie specified by 'name'
  res.redirect("/urls");
});

// PAGE - Register
app.get("/register", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render("register", templateVars);
});

// Add - add new account
// form with an email address and password field
// email field should use type=email and have name=email. The password field should use type=password and have name=password.
// app.post("/register", (req, res) => {
//   res.clearCookie("username"); // clear cookie specified by 'name'
//   res.redirect("/urls");
// });

// Redirects to longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});
app.get("/not_found", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render("not_found", templateVars);
});
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.get("/hello", (req, res) => {
  const templateVars = {
    greeting: "Hello World!",
    username: req.cookies["username"],
  };
  res.render("hello_world", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// returns a string of 6 random alphanumeric characters
const generateRandomString = function () {
  return Math.random().toString(36).substr(2, 6);
};
