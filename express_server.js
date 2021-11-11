const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const urlDB = require('./data/urlData');
const userDB = require('./data/userData');
const userHelpers = require('./helpers/userHelpers');
const { generateRandomString, urlsForUser, isCreator, authenticateUser } = userHelpers(userDB);

const app = express();
const PORT = 8080; // default port 8080
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs"); // sets EJS as template view engine, checks views dir

// Root
app.get("/", (req, res) => {
  res.send("Hello!");
});

// My URLs - urls_index
app.get("/urls", (req, res) => {
  const urlsForUserDB = urlsForUser(req.cookies["user_id"], urlDB);
  const templateVars = { urls: urlsForUserDB, user: userDB[req.cookies["user_id"]] };
  console.log('User Info:', templateVars.user);
  // console.log('urlsDatabase:', templateVars.urls);
  res.render("urls_index", templateVars);
});

// Create TinyURL - urls_new - should be defined before GET /urls/:id
app.get("/urls/new", (req, res) => {
  const templateVars = { user: userDB[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

// Create TinyURL - ADD
app.post("/urls", (req, res) => {
  if (!userDB[req.cookies["user_id"]]) {
    return res.send('Only registered users can create new URLs');
  }
  const newShortURL = generateRandomString();
  const longURL = req.body.longURL;
  const userID = req.cookies["user_id"];
  urlDB[newShortURL] = { longURL, userID };
  console.log('New URL:', urlDB[newShortURL]);
  res.redirect(`/urls/${newShortURL}`);
});

// My URLs - EDIT change longURL
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const urlCreator = isCreator(req.cookies["user_id"], urlDB, shortURL);
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
  const urlCreator = isCreator(req.cookies["user_id"], urlDB, shortURL);
  if (!urlCreator) {
    return res.status(403).send("You do not have permission to delete this.");
  }
  console.log('Deleting:', urlDB[shortURL]);
  delete urlDB[shortURL];
  res.redirect("/urls");
});

// TinyURL Info - urls_show
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDB[shortURL]) {
    res.redirect("/not_found");
  }
  const longURL = urlDB[shortURL].longURL;
  const userID = req.cookies["user_id"];
  const urlCreator = isCreator(userID, urlDB, shortURL);
  const templateVars = { shortURL, longURL, urlCreator, user: userDB[userID] };
  res.render("urls_show", templateVars);
});



// Login
app.get("/login", (req, res) => {
  const userID = req.cookies["user_id"];
  if (userID) { // redirect if already logged in
    res.redirect("/urls");
  }
  const templateVars = { user: userDB[userID] };
  res.render("login", templateVars);
});
// Login - POST
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const { data, error } = authenticateUser(userDB, email, password);
  if (error) return res.status(403).send(error);
  if (data) res.cookie("user_id", data);
  res.redirect("/urls");
});
// Logout - POST
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});





// REGISTRATION
// PAGE - Register Account
app.get("/register", (req, res) => {
  if (userDB[req.cookies["user_id"]]) {
    console.log('You are already registered');
    res.redirect('/urls');
  } else {
    const templateVars = { user: userDB[req.cookies["user_id"]] };
    res.render("register", templateVars);
  }
});
// POST - Register Account: userid, email, password
app.post("/register", (req, res) => {

  // console.log(req.body); // { email: 'asdf@gmail.com', password: '1234' }
  console.log(req.cookies); // { user_id: 'd7xepi' }
  const email = req.body.email;
  const password = req.body.password;

  for (let user in userDB) {
    if (email === userDB[user].email) {
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
  userDB[user] = { id: user, email, password }; // add new user to DB
  res.cookie('user_id', user); // create cookie
  res.redirect("/urls");
});


// REDIRECT to longURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDB[shortURL]) {
    return res.send('short URL does not exist');
  } else {
    const longURL = urlDB[shortURL].longURL;
    res.redirect(longURL);
  }
});
app.get("/not_found", (req, res) => {
  const templateVars = { user: userDB[req.cookies["user_id"]] };
  res.render("not_found", templateVars);
});
app.get("/urls.json", (req, res) => {
  res.json(urlDB);
});
app.get("/hello", (req, res) => {
  const templateVars = {
    greeting: "Hello World!",
    user: userDB[req.cookies["user_id"]],
  };
  res.render("hello_world", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
