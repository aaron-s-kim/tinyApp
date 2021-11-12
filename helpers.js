const bcrypt = require('bcryptjs');

const userHelpers = (userDB) => {

  // returns string of 6 random alphanumeric characters
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

  const getUserByEmail = function(email, userDB) {
    for (let user in userDB) {
      if (email === userDB[user].email) {
        return user;
      }
    }
  };

  // adds 'https://' to url if not present
  const addHTTPS = function(url) {
    if (url.substring(0,8) !== "https://") {
      return ("https://").concat(url);
    }
    return url;
  };

  return {
    generateRandomString,
    urlsForUser,
    isCreator,
    emptyInput,
    getUserByEmail,
    addHTTPS
  };
};

module.exports = userHelpers;