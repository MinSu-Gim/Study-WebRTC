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
  /**
   * Socket 관련 Listener
   */

  socket.on("disconnect", () => {
    console.log("연결 종료");
  });
  socket.on("close-event", (roomName) => {
    console.log("server roomName: ", roomName);
    socket.to(roomName).emit("close-event");
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

  /**
   * RobotJS 관련 Listener
   */

  function convertCoord(coords, xy) {
    if (xy === "x") {
      return (robot.getScreenSize().width * coords.x) / coords.videoWidth;
    } else if (xy === "y") {
      return (robot.getScreenSize().height * coords.y) / coords.videoHeight;
    } else {
      return;
    }
  }

  // socket.on("leftClick", (coords) => {
  //   console.log("click")
  //   robot.moveMouse(convertCoord(coords, "x"), convertCoord(coords, "y"));
  // });

  // socket.on("rightClick", (coords) => {
  //   robot.moveMouse(convertCoord(coords, "x"), convertCoord(coords, "y"));
  //   robot.mouseClick("right");
  // });

  // socket.on("mouseDown", (coords) => {
  //   robot.moveMouse(convertCoord(coords, "x"), convertCoord(coords, "y"));
  //   robot.mouseToggle("down");
  // });

  // socket.on("mouseMove", (coords) => {
  //   robot.moveMouse(convertCoord(coords, "x"), convertCoord(coords, "y"));
  // });

  // socket.on("dragMouse", (coords) => {
  //   robot.dragMouse(convertCoord(coords, "x"), convertCoord(coords, "y"));
  // });

  // socket.on("mouseUp", () => {
  //   robot.mouseToggle("up");
  // });

  // socket.on("scroll", (delta) => {
  //   robot.scrollMouse(delta.x, delta.y);
  // });

  socket.on("keypress", (key) => {
    console.log("keypress: ", key);
    // robot.keyTap(key);
  });
});

const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);
