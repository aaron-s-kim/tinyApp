const bcrypt = require('bcryptjs');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const express = require("express");
const methodOverride = require('method-override')

const userDB = require('./data/userData');
const urlDB = require('./data/urlData');
const userHelpers = require('./helpers');
// deconstructed for simplicity
const { generateRandomString, urlsForUser, isCreator, emptyInput, getUserByEmail, addHTTPS, totalVisitCount } = userHelpers(userDB, urlDB);

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
app.use(methodOverride('_method')) // override with POST having ?_method=DELETE




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
  const urlsForUserDB = urlsForUser(userID);
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
  const urlCreator = isCreator(userID, shortURL);
  const date = urlDB[shortURL].date;
  const uniqueVisits = Object.keys(urlDB[shortURL].visitors).length;
  const totalVisits = totalVisitCount(shortURL);
  const templateVars = { shortURL, longURL, urlCreator, user: userDB[userID], date, uniqueVisits, totalVisits, visitors: urlDB[shortURL].visitors };
  res.render("urls_show", templateVars);
});


// | EDIT |

// Short URL - update long URL
app.put("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const urlCreator = isCreator(req.session.userID, shortURL);
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
  longURL = addHTTPS(longURL); // adds https:// if not present
  const newShortURL = generateRandomString(); // creates new shortURL string
  const date = new Date().toDateString(); 
  urlDB[newShortURL] = { longURL, userID, date, visitors: {} }; // creates new shortURL obj
  res.redirect(`/urls/${newShortURL}`);
});


// | DELETE |

app.delete("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const urlCreator = isCreator(req.session.userID, shortURL);
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
  // req.session.userID = null;
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
  if (!urlDB[shortURL]) { // if shortURL does not exist, redirect to not found
    return res.redirect('/not_found');
  }

  let userID = req.session.userID;
  const date = new Date().toUTCString();

  console.log('testing inside /u/:shortURL')
  console.log(urlDB[shortURL].visitors) // empty

  console.log('before creating newArr for existing user ')

  if (userID) { // if existing userID, but no visit tracking, create new obj
    if (!urlDB[shortURL].visitors[userID]) {
      urlDB[shortURL].visitors[userID] = [];
    }
  }

  console.log('after creating newArr for existing user ')
  console.log(urlDB[shortURL].visitors) // => { userID: [] }

  if (!userID) { // if no userID found, create new userID to track visits
    userID = generateRandomString();
    req.session.visitor = userID;
    urlDB[shortURL].visitors[userID] = [];
  }
  
  urlDB[shortURL].visitors[userID].push(date);

  console.log('after push(date)');
  console.log(urlDB[shortURL].visitors) // => { b2kj6z: [ 'Sat, 20 Nov 2021 01:15:14 GMT' ] }

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
