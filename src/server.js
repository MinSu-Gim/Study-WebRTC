import http from "http";
import WebSocket from "ws";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

// HTTP 서버, WebSocket 서버 둘 다 실행
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const sockets = [];

wss.on("connection", (socket) => {
  console.log("Connected to the Browser!!!");

  sockets.push(socket);
  socket["nickname"] = "Anonymous";

  socket.on("message", (data) => {
    let msg = data.toString();

    const parseMsg = JSON.parse(msg);

    switch (parseMsg.type) {
      case "new_message":
        sockets.forEach((s) => {
          s.send(`${socket.nickname}: ${parseMsg.payload}`);
        });
        break;
      case "nickname":
        socket["nickname"] = parseMsg.payload;
        break;
    }
  });

  socket.on("close", () => {
    console.log("Disconnected from the Browser");
  });
});

server.listen(3000, handleListen);
