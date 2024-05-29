const { BALANCE } = require("../config/config");

module.exports = class User {
  constructor() {
    this.data = { credits: BALANCE };
  }

  get credits() {
    return this.data.credits;
  }

  getData() {
    return this.data;
  }

  set credits(newCredits) {
    this.data.credits = newCredits;
  }
};
