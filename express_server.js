const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

// const helpers = require('./helpers/userHelpers');
// const { func1, func2, func3 } = helpers();

const app = express();
const PORT = 8080; // default port 8080

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs"); // sets EJS as template view engine, checks views dir

// const urlDatabase = {
//   b2xVn2: "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com",
//   S152tx: "https://www.tsn.ca",
// };

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "user3RandomID": {
    id: "user3RandomID",
    email: "a@a.com",
    password: "1234"
  }
};


// PAGE - Root
app.get("/", (req, res) => {
  res.send("Hello!");
});


// PAGE - Main URLs Index
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  console.log('user:', templateVars.user);
  console.log('urlsDatabase:', templateVars.urls);
  res.render("urls_index", templateVars);
});

// PAGE - Create New shortURL; should be defined before GET /urls/:id
app.get("/urls/new", (req, res) => {
  if (!users[req.cookies["user_id"]]) {
    res.send('Only registered users can create new URLs');
    return res.redirect('/urls');
  }
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});
// ADD a new shortURL: longURL
app.post("/urls", (req, res) => {
  if (!users[req.cookies["user_id"]]) {
    res.send('Only registered users can create new URLs');
    return res.redirect('/urls');
  }

  const randShortURL = generateRandomString();
  urlDatabase[randShortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_id"]
  };
  res.redirect(`/urls/${randShortURL}`);
});

// EDIT a longURL
app.post("/urls/:shortURL", (req, res) => {
  const shortKey = req.params.shortURL;
  const longVal = req.body.longURL;
  urlDatabase[shortKey].longURL = longVal;
  res.redirect("/urls");
});
// DELETE a shortURL: longURL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortKey = req.params.shortURL;
  delete urlDatabase[shortKey];
  res.redirect("/urls");
});

// PAGE - Individual shortURL
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const templateVars = {
    shortURL,
    longURL: urlDatabase[shortURL].longURL,
    user: users[req.cookies["user_id"]],
  };

  if (!urlDatabase.hasOwnProperty(shortURL)) {
    res.redirect("/not_found");
  } else {
    res.render("urls_show", templateVars);
  }
});

// LOGIN
// PAGE - Login
app.get("/login", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  console.log('user:',templateVars.user);
  res.render("login", templateVars);
});
// POST - Login
app.post("/login", (req, res) => {
  // console.log(req.body); // { email: 'asdf@gmail.com', password: '1234' }
  const email = req.body.email;
  const password = req.body.password;
  console.log('email:', email, 'password:', password);
  let emailFound, passwordFound;

  for (let user in users) {
    if (email === users[user].email) {
      emailFound = true;
      if (password === users[user].password) {
        passwordFound = true;
        res.cookie("user_id", user);
      }
    }
  }

  if (!emailFound) {
    res.status(403);
    return res.send('Status Code: 403 - Forbidden. Email address not found');
  }
  if (!passwordFound) {
    res.status(403);
    return res.send('Status Code: 403 - Forbidden. Incorrect password');
  }

  res.redirect("/urls");
});
// POST - Logout
app.post("/logout", (req, res) => {
  // res.clearCookie("user");
  res.clearCookie("user_id");
  res.redirect("/urls");
});


// REGISTRATION
// PAGE - Register
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("register", templateVars);
});
// POST - Register New: user, email, password
app.post("/register", (req, res) => {
  // console.log(req.body); // { email: 'asdf@gmail.com', password: '1234' }
  console.log(req.cookies); // { user_id: 'd7xepi' }
  const email = req.body.email;
  const password = req.body.password;

  for (let user in users) {
    if (email === users[user].email) {
      res.status(400);
      return res.send('Status Code: 400 - Email address already exists');
    }
  }
  if (!email) {
    res.status(400);
    return res.send('Status Code: 400 - Email address cannot be empty');
    // res.sendStatus(400) === res.status(400).send('Bad Request')
  }
  if (!password) {
    res.status(400);
    return res.send('Status Code: 400 - Password cannot be empty');
  }

  const user = generateRandomString();
  users[user] = { id: user, email, password }; // add new user to DB
  res.cookie('user_id', user); // create cookie
  res.redirect("/urls");
});


// REDIRECT to longURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});
app.get("/not_found", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("not_found", templateVars);
});
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.get("/hello", (req, res) => {
  const templateVars = {
    greeting: "Hello World!",
    user: users[req.cookies["user_id"]],
  };
  res.render("hello_world", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// returns a string of 6 random alphanumeric characters
const generateRandomString = function() {
  return Math.random().toString(36).substr(2, 6);
};
