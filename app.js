let localStream;
let remoteStream;
let pc;

const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

async function start() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    document.getElementById("localVideo").srcObject = localStream;

    pc = new RTCPeerConnection(configuration);
    pc.addEventListener("icecandidate", handleIceCandidate);
    pc.addEventListener("addstream", handleRemoteStreamAdded);

    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // In a real application, you'd send the offer to a remote peer via signaling server
    // For simplicity, we'll just simulate this by setting a timeout and generating an answer
    setTimeout(() => {
      const answer = createAnswer();
      receiveAnswer(answer);
    }, 2000);
  } catch (error) {
    console.error("Error starting call:", error);
  }
}

function handleIceCandidate(event) {
  if (event.candidate) {
    // In a real application, you'd send the candidate to the remote peer via signaling server
    // For simplicity, we'll just log it
    console.log("ICE candidate:", event.candidate);
  }
}

function handleRemoteStreamAdded(event) {
  remoteStream = event.stream;
  document.getElementById("remoteVideo").srcObject = remoteStream;
}

async function createAnswer() {
  try {
    const offer = pc.localDescription;
    const remoteDesc = new RTCSessionDescription(offer);

    pc = new RTCPeerConnection(configuration);
    pc.addEventListener("icecandidate", handleIceCandidate);
    pc.addEventListener("addstream", handleRemoteStreamAdded);
    pc.setRemoteDescription(remoteDesc);

    remoteStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    document.getElementById("localVideo").srcObject = remoteStream;

    remoteStream
      .getTracks()
      .forEach((track) => pc.addTrack(track, remoteStream));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    return pc.localDescription;
  } catch (error) {
    console.error("Error creating answer:", error);
    return Promise.reject(error);
  }
}

function receiveAnswer(answer) {
  setTimeout(() => {
    const remoteDesc = new RTCSessionDescription(answer);
    pc.setRemoteDescription(remoteDesc);
  }, 2000);
}

function hangUp() {
  stopRecording();
  if (pc) {
    pc.close();
    localStream.getTracks().forEach((track) => track.stop());
    document.getElementById("localVideo").srcObject = null;
    document.getElementById("remoteVideo").srcObject = null;
  }
}

let mediaRecorder;
let recordedChunks = [];

function startRecording() {
  if (localStream) {
    mediaRecorder = new MediaRecorder(localStream);
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
}

function handleDataAvailable(event) {
  if (event.data.size > 0) {
    recordedChunks.push(event.data);
  }
}

function downloadRecording() {
  const blob = new Blob(recordedChunks, { type: "video/webm" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  document.body.appendChild(a);
  a.style.display = "none";
  a.href = url;
  a.download = "recording.webm";
  a.click();
  window.URL.revokeObjectURL(url);
}
