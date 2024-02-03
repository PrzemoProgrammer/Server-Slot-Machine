const { app, server, port, socketServer } = require("./index");
// const databaseManager = require("./MongoDB/DatabaseManager");
const GameManager = require("./game/manager/GameManager");
const {
  authentication,
  registration,
} = require("./controllers/authorization/index");
const {
  createPayment,
  success,
  cancel,
} = require("./controllers/payPal/index");

server.listen(port, async () => {
  // await databaseManager.connectDatabase();
  app.post("/authentication", authentication);
  app.post("/registration", registration);
  // app.post("/create_payment", createPayment);
  // app.get("/success", success);
  // app.get("/cancel", cancel);

  socketServer.on("connection", (socket) => {
    console.log("new user");
    GameManager.createNewUser(socket.id);

    socket.once("getUserState", (data) => {
      const userState = GameManager.getUserState(socket.id, data);
      socket.emit("userState", userState);
    });

    socket.on("spinAction", async (data) => {
      const updatedGameData = await GameManager.userSpinAction(socket.id, data);
      socket.emit("updateGameData", updatedGameData);
    });

    socket.on("disconnect", () => {
      console.log(`user ${socket.id} disconect`);
      GameManager.deleteUser(socket.id);
    });
  });

  console.log(`Listening on ${server.address().port}`);
});
