const socket = new WebSocket(`ws://${window.location.host}`);

socket.addEventListener("open", () => {
  console.log("Connected to the Server!!!");
});

socket.addEventListener("message", (message) => {
  console.log(`New messge: ${message.data}`);
});

socket.addEventListener("close", () => {
  console.log(`UnConnected to the Server!!!`);
});

setTimeout(() => {
  socket.send("hello from the browser!");
}, 3000);
