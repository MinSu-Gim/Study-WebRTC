const socket = io();

const share_screen = document.getElementById("screen");
const enterBtn = document.getElementById("enter");

enterBtn.hidden = true;

let myStream;

/**
 * Welcome Form (Join a Room!)
 */

let roomName;

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function startCapture() {
  await navigator.mediaDevices
    .getDisplayMedia({
      video: { cursor: "always" },
      audio: { echoCancellation: true, noiseSuppression: true },
    })
    .then((stream) => {
      myStream = stream;
      share_screen.srcObject = stream;

      const videoTrack = stream.getVideoTracks()[0];

      videoTrack.onended = function () {
        socket.emit("close-event", roomName);
        socket.disconnect();
        myPeerConnection.close();
      };
    });
}

async function initCall() {
  welcome.hidden = true;
  enterBtn.hidden = false;

  await startCapture();

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

/**
 * RTC Code
 */

function handleIce(data) {
  console.log(`send Candidate`);
  socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
  console.log("got an event from my peer");
  console.log("Peer Stream:", data.stream);
  console.log("Mine Stream:", myStream);

  share_screen.srcObject = data.stream;
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

  console.log("myStream: ", myStream);
  myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
}

share_screen.addEventListener("click", (e) => {
  startCapture();
});
