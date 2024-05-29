const { app, server, port, socketServer } = require("./index");
// const GameManager = require("./game/manager/GameManager");
const {
  authentication,
  registration,
} = require("./controllers/authorization/index");
const SocketManager = require("./Socket/manager/SocketManager");

// const {
//   createPayment,
//   success,
//   cancel,
// } = require("./controllers/payPal/index");

server.listen(port, async () => {
  // await databaseManager.connectDatabase();
  app.post("/authentication", authentication);
  app.post("/registration", registration);
  // app.post("/create_payment", createPayment);
  // app.get("/success", success);
  // app.get("/cancel", cancel);
  this.socketManager = new SocketManager(socketServer);

  console.log(`Listening on ${server.address().port}`);
});
