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

  socket.on("enter_room", (roomName, done) => {
    console.log(roomName)
    socket.join(roomName);
    done();
    console.log(socket.rooms)
    socket.to(roomName).emit("welcome");
  });
});

httpServer.listen(3000, handleListen);
