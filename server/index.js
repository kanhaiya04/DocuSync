const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const app = express();
dotenv.config({ path: "../.env" });
app.use(express.json());
app.use(cors());

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
app.use("/doc/",require("./routes/docRoutes"));

io.on("connection", (socket) => {
  socket.on("join-room", (roomid) => {
    socket.join(roomid);
  });

  socket.on("updateDoc", (payload, roomid) => {
    console.log("Payload:", payload);
    io.to(roomid).emit("updatedDoc", payload);
  });
});

httpServer.listen(5000);
