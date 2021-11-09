
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs'); // tells Express app to set EJS as templating view engine
// EJS knows to check views directory for template files with ext .ejs
// vars sent to EJS template must be inside object

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "S152tx": "https://www.tsn.ca"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  const randShort = generateRandomString();
  urlDatabase[randShort] = req.body.longURL;
  console.log(urlDatabase);
  // res.send("Ok");
  res.redirect(`/urls/${randShort}`);
});

// should be defined before GET /urls/:id, otherwise Express will think 'new' is a route parameter
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
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

// READ
app.get("/urls/:shortURL", (req, res) => { // ':' indicates 'shortURL' is a route parameter
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  
  if (!urlDatabase.hasOwnProperty(req.params.shortURL)) {
    console.log(req.params.shortURL);
    res.redirect("/not_found");
  } else {
    console.log(templateVars);
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});



app.get("/not_found", (req, res) => {
  res.render("not_found");
});
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.get("/hello", (req, res) => {
  const templateVars = { greeting: 'Hello World!' };
  res.render("hello_world", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// return a string of 6 random alphanumeric characters
const generateRandomString = function() {
  return Math.random().toString(36).substr(2, 6);
};