const bcrypt = require('bcryptjs');

const userHelpers = (userDB) => {

  // returns a string of 6 random alphanumeric characters
  const generateRandomString = function() {
    return Math.random().toString(36).substr(2, 6);
  };

  // returns urls from urlDB specific to userID
  const urlsForUser = function(id, urlDB) {
    const urlsForUserDB = {};
    for (let key in urlDB) {
      if (id === urlDB[key].userID) {
        urlsForUserDB[key] = urlDB[key];
      }
    }
    return urlsForUserDB;
  };

  // returns true if url creator, false, if not
  const isCreator = function(cookie, urlDB, key) {
    let urlCreator = true;
    if (cookie !== urlDB[key].userID) {
      return urlCreator = false;
    }
    return urlCreator;
  };
  
  const emptyInput = function(email, password) {
    if (!email) return 'No email address entered';
    if (!password) return 'No password entered';
  };

  // validate user login
  const validateLogin = function(userDB, email, password) {
    let emailFound, passwordFound;
    for (let user in userDB) {
      if (email === userDB[user].email) {
        emailFound = true;
        if (bcrypt.compareSync(password, userDB[user].hashedPassword)) {
          return { data: user, error: null };
        }
        // if (password === userDB[user].password) {
        //   passwordFound = true;
        //   return { data: user, error: null };
        // }
      }
    }
    if (!emailFound) {
      return { data: null, error: 'Email address not found.' };
    }
    if (!passwordFound) {
      return { data: null, error: 'Incorrect password' };
    }
  };

  const findUserByEmail = function(userDB, email) {
    for (let user in userDB) {
      if (email === userDB[user].email) {
        return userDB[user];
      }
    }
  };

  // validate user registration
  const validateReg = function(userDB, email, password) {
    if (emptyInput(email, password)) return emptyInput(email, password);
    for (let user in userDB) {
      if (email === userDB[user].email) {
        return { error: 'Email address already exists.' };
      }
    }
    return { error: null };
  };

  return {
    generateRandomString,
    urlsForUser,
    isCreator,
    emptyInput,
    findUserByEmail,
    validateLogin,
    validateReg,
  };
};

module.exports = userHelpers;