const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

const call = document.getElementById("call");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    // console.log(devices);
    const cameras = devices.filter((devcie) => devcie.kind === "videoinput");
    // console.log(cameras);
    const currentCamera = myStream.getVideoTracks()[0];

    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;

      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}

async function getMedia(deviceId) {
  const initialConstrains = {
    audio: true,
    video: { facingMode: "user" },
  };

  const cameraConstraints = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
  };

  try {
    myStream = await navigator.mediaDevices.getUserMedia(deviceId ? cameraConstraints : initialConstrains);
    myFace.srcObject = myStream;

    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
}

// getMedia();

function handleMuteClick() {
  // console.log(myStream.getAudioTracks());
  // console.log(myStream.getVideoTracks());

  myStream.getAudioTracks().forEach((track) => {
    track.enabled = !track.enabled;
  });

  if (!muted) {
    muteBtn.innerText = "UnMute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}

function handleCameraClick() {
  myStream.getVideoTracks().forEach((track) => {
    track.enabled = !track.enabled;
  });

  if (cameraOff) {
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = true;
  }
}

async function handleCameraChange() {
  // console.log(camerasSelect.value);
  await getMedia(camerasSelect.value);
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

/**
 * Welcome Form (Join a Room!)
 */

let roomName;

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall() {
  welcome.hidden = true;
  call.hidden = false;

  await getMedia();

  makeConnection();
}

async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initCall();
  socket.emit("join_room", input.value);

  roomName = input.value;
  input.value = "";
}

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

  console.log("send the Answer")
  socket.emit("answer", answer, roomName);
});

socket.on("answer", (answer) => {
  console.log("receive the Answer")
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", ice => {
  console.log(`receive Candidate`);
  myPeerConnection.addIceCandidate(ice);
})

/**
 * RTC Code
 */

function handleIce(data) {
  console.log(`send Candidate`);
  socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
  console.log("got an event from my peer");
  console.log('Peer Stream:', data.stream);
  console.log('Mine Stream:', myStream);

  const peerFace = document.getElementById("peerFace");
  peerFace.srcObject = data.stream;
}

let myPeerConnection;
function makeConnection() {

  myPeerConnection = new RTCPeerConnection();
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("addstream", handleAddStream);

  myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
}
