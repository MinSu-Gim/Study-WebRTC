import http from "http";
import { Server } from "socket.io";
import express from "express";

const robot = require("@jitsi/robotjs");

// Speed up the mouse.
robot.setMouseDelay(1);

let screenSize = robot.getScreenSize();
let height = screenSize.height / 2 - 10;

// for (let x = 0; x < 200; x++) {
//   let y = height + x;
//   robot.moveMouse(x, y);
// }

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/remote", (req, res) => res.render("remote"));
app.get("/*", (req, res) => res.redirect("/"));

// HTTP 서버, WebSocket 서버 둘 다 실행
const httpServer = http.createServer(app);
const wsServer = new Server(httpServer);

wsServer.on("connection", (socket) => {
  socket.on("disconnect", () => {
    // console.log(socket);
    console.log("연결 종료");
  });
  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    socket.to(roomName).emit("welcome");
  });
  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer);
  });
  socket.on("answer", (answer, roomName) => {
    socket.to(roomName).emit("answer", answer);
  });
  socket.on("ice", (ice, roomName) => {
    socket.to(roomName).emit("ice", ice);
  });
});

const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);
