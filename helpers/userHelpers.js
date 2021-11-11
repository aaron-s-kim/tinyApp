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

  // authenticates user login
  const authenticateUser = function(userDB, email, password) {
    let emailFound, passwordFound;
    for (let user in userDB) {
      if (email === userDB[user].email) {
        emailFound = true;
        if (password === userDB[user].password) {
          passwordFound = true;
          return { data: user, error: null };
        }
      }
    }
    if (!emailFound) {
      return { data: null, error: 'Email address not found.' };
    }
    if (!passwordFound) {
      return { data: null, error: 'Incorrect password' };
    }
  };

  return {
    generateRandomString,
    urlsForUser,
    isCreator,
    authenticateUser
  };
};

module.exports = userHelpers;