const bcrypt = require('bcryptjs');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const express = require("express");
// const method-override = require('');

const urlDB = require('./data/urlData');
const userDB = require('./data/userData');
const userHelpers = require('./helpers');
const { generateRandomString, urlsForUser, isCreator, emptyInput, getUserByEmail, validateLogin, validateReg } = userHelpers(userDB);

const app = express();
const PORT = 8080; // default port 8080
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'], // secret keys
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs"); // sets EJS as template view engine, checks views dir


// Root
app.get("/", (req, res) => {
  res.send("Hello!");
});

// My URLs - urls_index
app.get("/urls", (req, res) => {
  const userID = req.session.userID;
  console.log('cookiesession:', userID);
  const urlsForUserDB = urlsForUser(userID, urlDB);
  const templateVars = { urls: urlsForUserDB, user: userDB[userID] };
  if (userID && !userDB[userID]) { // if userID exists, but userDB[userID] null
    return res.redirect("/register");
  }
  console.log('User Info:', templateVars.user);
  res.render("urls_index", templateVars);
});

// Create TinyURL - ADD
app.post("/urls", (req, res) => {
  if (!userDB[req.session.userID]) {
    return res.send('Only registered users can create new URLs');
  }
  const newShortURL = generateRandomString();
  const longURL = req.body.longURL;
  const userID = req.session.userID;
  urlDB[newShortURL] = { longURL, userID };
  console.log('New URL:', urlDB[newShortURL]);
  res.redirect(`/urls/${newShortURL}`);
});


// Create TinyURL - urls_new - should be defined before GET /urls/:id
app.get("/urls/new", (req, res) => {
  const templateVars = { user: userDB[req.session.userID] };
  res.render("urls_new", templateVars);
});


// TinyURL Info - urls_show
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDB[shortURL]) {
    return res.redirect("/not_found");
  }
  const longURL = urlDB[shortURL].longURL;
  const userID = req.session.userID;
  const urlCreator = isCreator(userID, urlDB, shortURL);
  const templateVars = { shortURL, longURL, urlCreator, user: userDB[userID] };
  res.render("urls_show", templateVars);
});

// My URLs - EDIT change longURL
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const urlCreator = isCreator(req.session.userID, urlDB, shortURL);
  if (!urlCreator) {
    return res.status(403).send("You do not have permission to modify this.");
  }
  const longURL = req.body.longURL;
  urlDB[shortURL].longURL = longURL;
  console.log('Long URL edited to:', longURL);
  res.redirect("/urls");
});

// My URLs - DELETE shortURL: longURL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const urlCreator = isCreator(req.session.userID, urlDB, shortURL);
  if (!urlCreator) {
    return res.status(403).send("You do not have permission to delete this.");
  }
  console.log('Deleting:', urlDB[shortURL]);
  delete urlDB[shortURL];
  res.redirect("/urls");
});


// LOGIN
app.get("/login", (req, res) => {
  const userID = req.session.userID;
  if (userID) return res.redirect("/urls"); // redirect if already logged in
  const templateVars = { user: userDB[userID] };
  res.render("login", templateVars);
});
// Login - POST
app.post("/login", (req, res) => {
  const userID = req.session.userID;
  if (userID) return res.redirect("/urls"); // redirect if already logged in

  const email = req.body.email;
  const password = req.body.password;
  const empty = emptyInput(email, password);
  if (empty) return res.status(400).send(empty); // 400 forbidden
  const user = getUserByEmail(email, userDB);
  if (!user) return res.status(400).send('Email address not found.'); // 400 forbidden

  bcrypt.compare(password, userDB[user].password, (err, success) => {
    if (!success) {
      return res.status(400).send('password does not match');
    }
    req.session.userID = user; // set cookie

    res.redirect("/urls");
  });

});
// Logout - POST
app.post("/logout", (req, res) => {
  // res.clearCookie("user_id");
  req.session = null;
  res.redirect("/urls");
});



// REGISTER
app.get("/register", (req, res) => {
  const userID = req.session.userID;
  if (userDB[userID]) return res.redirect('/urls'); // redirect if already logged in
  const templateVars = { user: userDB[userID] };
  res.render("register", templateVars);
});

// Register - POST - Account: userid, email, password
app.post("/register", (req, res) => {
  const userID = req.session.userID;
  if (userDB[userID]) return res.redirect('/urls'); // redirect if already logged in

  const email = req.body.email;
  const password = req.body.password;
  const empty = emptyInput(email, password);
  if (empty) return res.status(400).send(empty); // 400 forbidden
  
  const userEx = getUserByEmail(email, userDB);
  if (userEx) return res.status(400).send('Email already registered.'); // 400 forbidden

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, (err, hash) => {
      const id = generateRandomString();
      userDB[id] = { id, email, password: hash };
      req.session.userID = id;
      res.redirect('/urls');
    });
  });
});




// REDIRECT to longURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDB[shortURL]) {
    return res.status(404).send('short URL does not exist');
  }
  const longURL = urlDB[shortURL].longURL;
  res.redirect(longURL);
});
app.get("/not_found", (req, res) => {
  const userID = req.session.userID;
  const templateVars = { user: userDB[userID] };
  res.render("not_found", templateVars);
});
app.get("/urls.json", (req, res) => {
  res.json(urlDB);
});
app.get("/hello", (req, res) => {
  const templateVars = {
    greeting: "Hello World!",
    user: userDB[req.session.userID],
  };
  res.render("hello_world", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
