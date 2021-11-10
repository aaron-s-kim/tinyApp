const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");

const app = express();
const PORT = 8080; // default port 8080

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs'); // tells Express app to set EJS as templating view engine
// EJS knows to check views directory for template files with ext .ejs
// vars sent to EJS template must be inside object

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "S152tx": "https://www.tsn.ca"
};

// this is a change made on branch feature/cookies


app.get("/", (req, res) => {
  res.send("Hello!");
});

// PAGE - Main URLs Index
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

// PAGE - Create New shortURL
// should be defined before GET /urls/:id, otherwise Express will think 'new' is a route parameter
app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});


app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  const randShort = generateRandomString();
  urlDatabase[randShort] = req.body.longURL;
  console.log(urlDatabase);
  // res.send("Ok");
  res.redirect(`/urls/${randShort}`);
});

// EDIT edit a longURL
app.post('/urls/:shortURL', (req, res) => {
  const shortKey = req.params.shortURL;
  const longVal = req.body.longURL;
  // console.log(urlDatabase[shortKey]); // original longURL
  urlDatabase[shortKey] = longVal;
  res.redirect('/urls');
});

// DELETE delete a shortURL: longURL
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortKey = req.params.shortURL;
  console.log('key to delete:', shortKey);
  console.log('database before deletion:', urlDatabase);
  delete urlDatabase[shortKey];
  console.log('database after deletion:', urlDatabase);
  res.redirect('/urls');
});

// PAGE - Individual shortURL
app.get("/urls/:shortURL", (req, res) => { // ':' indicates route parameter
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"] };
  
  if (!urlDatabase.hasOwnProperty(req.params.shortURL)) {
    console.log(req.params.shortURL);
    res.redirect("/not_found");
  } else {
    console.log(templateVars);
    res.render("urls_show", templateVars);
  }
});


// Login
app.post("/login", (req, res) => {
  // console.log('Cookies:', req.cookies); // cookies that have not been signed
  // console.log('req.body:', req.body); // should be { username: <form input val> }

  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

// Logout
app.post("/logout", (req, res) => {
  res.clearCookie('username'); // clear cookie specified by 'name'
  res.redirect('/urls');
});


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
  const templateVars = { greeting: 'Hello World!', username: req.cookies["username"], };
  res.render("hello_world", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// return a string of 6 random alphanumeric characters
const generateRandomString = function() {
  return Math.random().toString(36).substr(2, 6);
};