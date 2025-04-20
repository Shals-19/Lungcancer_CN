const socket = io();

const startBtn = document.getElementById('startCall');
const hangUpBtn = document.getElementById('hangUp');
const chatBox = document.getElementById('chatBox');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendMessage');

let localConnection;
let dataChannel;
let localStream;

startBtn.onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  localConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  localConnection.onicecandidate = e => {
    if (e.candidate) socket.emit('ice-candidate', e.candidate);
  };

  localStream.getTracks().forEach(track => {
    localConnection.addTrack(track, localStream);
  });

  dataChannel = localConnection.createDataChannel('chat');
  setupDataChannel();

  const offer = await localConnection.createOffer();
  await localConnection.setLocalDescription(offer);

  socket.emit('offer', offer);
};

sendBtn.onclick = () => {
  const msg = messageInput.value.trim();
  if (msg === '') return;

  if (dataChannel && dataChannel.readyState === "open") {
    dataChannel.send(msg);
    chatBox.innerHTML += `<p><b>You:</b> ${msg}</p>`;
    messageInput.value = '';
  } else {
    alert("Data channel is not open yet. Try again in a few seconds.");
  }
};


hangUpBtn.onclick = () => {
  localConnection.close();
  chatBox.innerHTML += "<p><i>Call ended</i></p>";
};

// Handle Incoming Data Channel
function setupDataChannel() {
  dataChannel.onmessage = e => {
    chatBox.innerHTML += `<p><b>Peer:</b> ${e.data}</p>`;
  };
}

// --- Socket.io Signaling ---

socket.on('offer', async offer => {
  localConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  localConnection.onicecandidate = e => {
    if (e.candidate) socket.emit('ice-candidate', e.candidate);
  };

  localConnection.ondatachannel = e => {
    dataChannel = e.channel;
    setupDataChannel();
  };

  localConnection.ontrack = e => {
    const remoteAudio = new Audio();
    remoteAudio.srcObject = e.streams[0];
    remoteAudio.play();
  };

  await localConnection.setRemoteDescription(new RTCSessionDescription(offer));
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  localStream.getTracks().forEach(track => {
    localConnection.addTrack(track, localStream);
  });

  const answer = await localConnection.createAnswer();
  await localConnection.setLocalDescription(answer);

  socket.emit('answer', answer);
});

socket.on('answer', async answer => {
  await localConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('ice-candidate', async candidate => {
  if (candidate) {
    await localConnection.addIceCandidate(candidate);
  }
});
