class UsersStorage {
  constructor() {
    this.users = {};
  }

  addUser(key, data) {
    this.users[key] = data;
  }

  getUser(key) {
    return this.users[key];
  }

  deleteUser(id) {
    delete this.users[id];
  }
}
module.exports = new UsersStorage();
