const databaseManager = require("../../MongoDB/DatabaseManager");
const JWT = require("../../JWT/JWTManager");
const GameManager = require("../../game/manager/GameManager");
// const eventEmitter = require("../../eventEmitter/eventEmitter");

class SocketManager {
  constructor(socketServer) {
    this.socketServer = socketServer;

    this.socketServer.on("connection", (socket) => {
      console.log("new user", socket.id);
      GameManager.createNewUser(socket.id);
      this.setupSocketListeners(socket);
    });
    this.setupGameListeners();
  }

  setupSocketListeners(socket) {
    socket.once("getUserState", (data) => {
      const userState = GameManager.getUserState(socket.id, data);
      socket.emit("userState", userState);
    });

    socket.on("spinAction", async (data) => {
      const updatedGameData = await GameManager.userSpinAction(socket.id, data);
      socket.emit("updateGameData", updatedGameData);
    });

    socket.on("disconnect", () => {
      console.log(`user ${socket.id} disconnect`);
      GameManager.deleteUser(socket.id);
    });
  }

  setupGameListeners() {
    // eventEmitter.on("getPlayers", (playersData) => {
    //   const { socketID, allLobbyAndGamePlayers } = playersData;
    //   this.socketServer.to(socketID).emit("getPlayers", allLobbyAndGamePlayers);
    // });
  }
}

module.exports = SocketManager;
