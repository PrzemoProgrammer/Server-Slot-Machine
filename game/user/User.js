module.exports = class User {
  constructor() {
    this.data = { credits: 10000000 };
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
