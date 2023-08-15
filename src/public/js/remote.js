const socket = io();

const myFace = document.getElementById("myFace");
const enterBtn = document.getElementById("call");

enterBtn.hidden = true;

let myStream;

/**
 * Welcome Form (Join a Room!)
 */

let roomName;

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall() {
  welcome.hidden = true;
  enterBtn.hidden = false;

  myStream = new MediaStream();

  makeConnection();
}

/**
 * 방 검색
 */
async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initCall();
  socket.emit("join_room", input.value);

  roomName = input.value;
  input.value = "";
}

// 주석
// window.onload = handleWelcomeSubmit;
welcomeForm.addEventListener("submit", handleWelcomeSubmit);

/**
 * Socket Code
 */

socket.on("welcome", async () => {
  // create a invitation for the other browsers to join
  // who we are, where we are
  const offer = await myPeerConnection.createOffer();
  // console.log(offer);
  // Once we had a offer, we have to configure our connections with the offer we just created
  myPeerConnection.setLocalDescription(offer);
  // send the offer!
  console.log(`Send the Offer: ${offer}`);
  socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
  console.log(`Receive the Offer: ${offer}`);
  myPeerConnection.setRemoteDescription(offer);

  const answer = await myPeerConnection.createAnswer();
  console.log(`And Make the Answer: ${answer}`);
  myPeerConnection.setLocalDescription(answer);

  console.log("send the Answer");
  socket.emit("answer", answer, roomName);
});

socket.on("answer", (answer) => {
  console.log("receive the Answer");
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
  console.log(`receive Candidate`);
  myPeerConnection.addIceCandidate(ice);
});

socket.on("diss", (data) => {
  console.log(`diss diss`);
  console.log(data);
});

socket.on("close-event", () => {
  socket.close();
});

/**
 * RTC Code
 */

window.onload = function () {
  var video = document.querySelector("#myFace");
  /**
   * Mouse, Keyboard Event
   */
  class coordsAndSize {
    constructor(event, video) {
      this.x = event.clientX - video.getBoundingClientRect().left;
      this.y = event.clientY - video.getBoundingClientRect().top;
      this.videoWidth = video.getBoundingClientRect().width;
      this.videoHeight = video.getBoundingClientRect().height;
    }
  }

  video.addEventListener("click", function (event) {
    // console.log(video.getBoundingClientRect().left);
    // console.log(video.getBoundingClientRect().right);
    // console.log(video.getBoundingClientRect().width);
    // console.log(video.getBoundingClientRect().height);
    event.stopPropagation();
    console.log("click: ", event);
    socket.emit("leftClick", new coordsAndSize(event, video));
  });

  video.addEventListener("contextmenu", function (event) {
    console.log("contextmenu: ", event);
    event.preventDefault();
    socket.emit("rightClick", new coordsAndSize(event, video));
  });

  video.addEventListener("wheel", function (event) {
    event.stopPropagation();
    event.preventDefault();
    console.log("wheel");
    socket.emit("scroll", {
      x: event.deltaX,
      y: event.deltaY,
    });
  });

  video.addEventListener("keypress", (event) => {
    event.preventDefault();
    event.stopPropagation();
    console.log(event);
    socket.emit("keypress", event.key);
  });
};

function handleIce(data) {
  console.log(`send Candidate`);
  socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
  console.log("got an event from my peer");
  console.log("Peer Stream:", data.stream);
  console.log("Mine Stream:", myStream);

  // const peerFace = document.getElementById("peerFace");
  myFace.srcObject = data.stream;
}

let myPeerConnection;
function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  });
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("addstream", handleAddStream);

  myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
}
