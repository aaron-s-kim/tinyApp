const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));


// set  view engine to ejs
app.set('view engine', 'ejs'); // tells Express app to use EJS as templating engine
// EJS knows to check views directory for template files with ext .ejs
// vars sent to an EJS template must be inside an object

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
  res.redirect(`/urls/${randShort}`);
});

// presents form to user
// should be defined before GET /urls/:id, otherwise Express will think 'new' is a route parameter
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// ':' indicates 'shortURL' is a route parameter
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  console.log(templateVars);
  res.render("urls_show", templateVars);
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