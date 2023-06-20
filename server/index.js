const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const app = express();
dotenv.config({ path: "../.env" });
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

(async function () {
  try {
    await mongoose.connect(process.env.mongoDb, {
      useNewUrlParser: true,  
    });
    console.log("Connected to db");
  } catch (error) {
    console.log("Error connecting to db");
  }
})();

app.use("/user/", require("./routes/userRoutes"));

io.on("connection", (socket) => {
  console.log("Socket:", socket);
  console.log("Socket is active and connected");

  socket.on("updateDoc", (payload) => {
    console.log("Payload:", payload);
    io.emit("updatedDoc", payload);
  });
});

httpServer.listen(5000);
