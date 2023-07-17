import http from "http";
import { Server } from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

// HTTP 서버, WebSocket 서버 둘 다 실행
const httpServer = http.createServer(app);
const wsServer = new Server(httpServer);

wsServer.on("connection", (socket) => {
  socket["nickname"] = "Anonymous";

  socket.on("enter_room", (roomName, done) => {
    console.log(roomName);
    socket.join(roomName);
    done();
    console.log(socket.rooms);
    socket.to(roomName).emit("welcome", socket.nickname);
  });

  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) => {
      socket.to(room).emit("bye", socket.nickname);
    });
  });

  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
    done();
  });

  socket.on("nickname", (nickname) => {
    socket["nickname"] = nickname;
  });
});

httpServer.listen(3000, handleListen);
