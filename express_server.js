const bcrypt = require('bcryptjs');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const express = require("express");

const urlDB = require('./data/urlData');
const userDB = require('./data/userData');
const userHelpers = require('./helpers');
const { generateRandomString, urlsForUser, isCreator, emptyInput, getUserByEmail, addHTTPS } = userHelpers(userDB);

const app = express();
const PORT = 8080;

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'], // secret keys
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set("view engine", "ejs");



// |    ROOT    |

app.get("/", (req, res) => {
  const userID = req.session.userID;
  if (!userID) return res.redirect("/login");
  if (userID) return res.redirect('/urls');
  const templateVars = { user: userDB[userID] };
  res.render('root', templateVars); // hidden page
});


// |    BROWSE    |

// My URLs
app.get("/urls", (req, res) => {
  const userID = req.session.userID;
  const urlsForUserDB = urlsForUser(userID, urlDB);
  const templateVars = { urls: urlsForUserDB, user: userDB[userID] };
  if (userID && !userDB[userID]) { // edge: if userID exists, but userDB[userID] null
    return res.redirect("/register");
  }
  res.render("urls_index", templateVars);
});

// Create New Short Link
app.get("/urls/new", (req, res) => {
  const userID = req.session.userID;
  if (!userID) {
    return res.redirect("/login");
  }
  const templateVars = { user: userDB[userID] };
  res.render("urls_new", templateVars);
});


// | READ |

// Short URL
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDB[shortURL]) {
    return res.redirect("/not_found");
  }
  const userID = req.session.userID;
  const longURL = urlDB[shortURL].longURL;
  const urlCreator = isCreator(userID, urlDB, shortURL);
  const date = urlDB[shortURL].date;
  const templateVars = { shortURL, longURL, urlCreator, user: userDB[userID], date };
  res.render("urls_show", templateVars);
});


// | EDIT |

// Short URL - update long URL
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const urlCreator = isCreator(req.session.userID, urlDB, shortURL);
  if (!urlCreator) {
    return res.status(401).send("401 Unauthorized - You do not have permission to modify this");
  }
  const longURL = req.body.longURL;
  if (!longURL) {
    return res.status(400).send("400 Bad Request - URL cannot be empty");
  }
  urlDB[shortURL].longURL = longURL;
  res.redirect("/urls");
});


// |    ADD    |

// Create New Short Link
app.post("/urls", (req, res) => {
  const userID = req.session.userID;
  if (!userDB[userID]) {
    return res.status(401).send('401 Unauthorized - Only registered users can create new URLs');
  }
  let longURL = req.body.longURL;
  longURL = addHTTPS(longURL);
  const newShortURL = generateRandomString();
  const date = new Date().toDateString();
  urlDB[newShortURL] = { longURL, userID, date };
  res.redirect(`/urls/${newShortURL}`);
});


// | DELETE |

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const urlCreator = isCreator(req.session.userID, urlDB, shortURL);
  if (!urlCreator) {
    return res.status(401).send("401 Unauthorized - You do not have permission to delete this URL.");
  }
  delete urlDB[shortURL];
  res.redirect("/urls");
});


// ||    LOGIN    ||

app.get("/login", (req, res) => {
  const userID = req.session.userID;
  if (userID) return res.redirect("/urls");
  const templateVars = { user: userDB[userID] };
  res.render("login", templateVars);
});

// Login - POST
app.post("/login", (req, res) => {
  const userID = req.session.userID;
  if (userID) return res.redirect("/urls");

  const email = req.body.email;
  const password = req.body.password;
  const empty = emptyInput(email, password);
  if (empty) return res.status(400).send(empty);

  const user = getUserByEmail(email, userDB);
  if (!user) return res.status(400).send('Email address not found.');

  bcrypt.compare(password, userDB[user].password, (err, success) => {
    if (!success) {
      return res.status(400).send('Password does not match');
    }
    req.session.userID = user;
    res.redirect("/urls");
  });

});

// Logout - POST
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});


// |    REGISTER    |

app.get("/register", (req, res) => {
  const userID = req.session.userID;
  if (userDB[userID]) return res.redirect('/urls'); // redirect if already logged in
  const templateVars = { user: userDB[userID] };
  res.render("register", templateVars);
});

// Register - POST
app.post("/register", (req, res) => {
  const userID = req.session.userID;
  if (userDB[userID]) return res.redirect('/urls');

  const email = req.body.email;
  const password = req.body.password;
  const empty = emptyInput(email, password);
  if (empty) return res.status(400).send(empty);
  
  const userEx = getUserByEmail(email, userDB);
  if (userEx) return res.status(400).send('Email already registered.');

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, (err, hash) => {
      const id = generateRandomString();
      userDB[id] = { id, email, password: hash };
      req.session.userID = id;
      res.redirect('/urls');
    });
  });
});


// Redirect to longURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDB[shortURL]) {
    return res.redirect('/not_found');
  }
  const longURL = urlDB[shortURL].longURL;
  res.redirect(longURL);
});

// Not Found
app.get("/not_found", (req, res) => {
  const userID = req.session.userID;
  const templateVars = { user: userDB[userID] };
  res.render("not_found", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDB);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
