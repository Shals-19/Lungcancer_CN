const socket = io();

// Replace with any room ID or use prompt
const room = prompt("Enter room ID to join:");
socket.emit('join', room);

const peer = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});

let dataChannel;
let remoteStream = new MediaStream();
const remoteAudio = document.getElementById('remoteAudio');
remoteAudio.srcObject = remoteStream;

navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
  });

peer.ontrack = event => {
  event.streams[0].getTracks().forEach(track => {
    remoteStream.addTrack(track);
  });
};

peer.onicecandidate = event => {
  if (event.candidate) {
    socket.emit('signal', { room, data: { candidate: event.candidate } });
  }
};

peer.ondatachannel = event => {
  dataChannel = event.channel;
  setupDataChannel();
};

document.getElementById('sendBtn').onclick = () => {
  const msg = document.getElementById('messageInput').value;
  dataChannel.send(msg);
  addMessage("You", msg);
  document.getElementById('messageInput').value = '';
};

function addMessage(sender, msg) {
  const chatBox = document.getElementById('chat-box');
  chatBox.innerHTML += `<p><strong>${sender}:</strong> ${msg}</p>`;
  chatBox.scrollTop = chatBox.scrollHeight;
}

function setupDataChannel() {
  dataChannel.onmessage = (e) => {
    addMessage("Peer", e.data);
  };
  dataChannel.onopen = () => {
    console.log("Data channel open");
  };
}

socket.on('new-peer', async () => {
  dataChannel = peer.createDataChannel("chat");
  setupDataChannel();

  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  socket.emit('signal', { room, data: { desc: offer } });
});

socket.on('signal', async ({ desc, candidate }) => {
  if (desc) {
    if (desc.type === 'offer') {
      await peer.setRemoteDescription(desc);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit('signal', { room, data: { desc: answer } });
    } else if (desc.type === 'answer') {
      await peer.setRemoteDescription(desc);
    }
  }
  if (candidate) {
    await peer.addIceCandidate(candidate);
  }
});
