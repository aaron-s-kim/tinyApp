const { assert } = require('chai');

const userHelpers = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const { generateRandomString, urlsForUser, isCreator, emptyInput, getUserByEmail, validateLogin, validateReg } = userHelpers(testUsers);


describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    // Write your assert statement here
    assert.equal(user, expectedUserID);
  });
  it('should return a user with valid email', function() {
    const user = getUserByEmail("not-in-DB@example.com", testUsers);
    const expectedUserID = undefined;
    // Write your assert statement here
    assert.equal(user, expectedUserID);
  });
});