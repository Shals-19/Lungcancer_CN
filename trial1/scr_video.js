const socket = io();
const peers = {};
let localStream;
const username = new URLSearchParams(window.location.search).get("username");

// 1. Get local video/audio
navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
  localStream = stream;
  addVideoStream("self", stream, username);

  // Tell server you joined
  socket.emit('join-video-call', { username });

  // Join video room
  socket.emit('join-video-stream', { username });

  // When others already exist
  socket.on('existing-video-users', users => {
    users.forEach(([id, existingUsername]) => {
      const peerConnection = createPeerConnection(id, existingUsername);
      peers[id] = peerConnection;

      stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

      peerConnection.createOffer().then(offer => {
        peerConnection.setLocalDescription(offer);
        socket.emit('offer', { offer, to: id, from: socket.id, username });
      });
    });
  });

  // When a new user joins
  socket.on('user-joined-video', ({ username, id }) => {
    const peerConnection = createPeerConnection(id, username);
    peers[id] = peerConnection;

    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
  });

  socket.on('offer', ({ offer, from, username }) => {
    const peerConnection = createPeerConnection(from, username);
    peers[from] = peerConnection;

    peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    peerConnection.createAnswer().then(answer => {
      peerConnection.setLocalDescription(answer);
      socket.emit('answer', { answer, to: from, from: socket.id });
    });
  });

  socket.on('answer', ({ answer, from }) => {
    peers[from].setRemoteDescription(new RTCSessionDescription(answer));
  });

  socket.on('ice-candidate', ({ candidate, from }) => {
    if (peers[from]) {
      peers[from].addIceCandidate(new RTCIceCandidate(candidate));
    }
  });
});

function createPeerConnection(peerId, username) {
  const peer = new RTCPeerConnection();

  peer.onicecandidate = event => {
    if (event.candidate) {
      socket.emit('ice-candidate', {
        to: peerId,
        candidate: event.candidate,
        from: socket.id,
      });
    }
  };

  peer.ontrack = event => {
    addVideoStream(peerId, event.streams[0], username);
  };

  return peer;
}

function addVideoStream(id, stream, username) {
  if (document.getElementById(`video-${id}`)) return;

  const videoContainer = document.createElement('div');
  videoContainer.classList.add('videoContainer');
  videoContainer.id = `video-${id}`;

  const videoElement = document.createElement('video');
  videoElement.srcObject = stream;
  videoElement.autoplay = true;
  videoElement.playsInline = true;

  const usernameLabel = document.createElement('div');
  usernameLabel.classList.add('username');
  usernameLabel.textContent = username;

  videoContainer.appendChild(videoElement);
  videoContainer.appendChild(usernameLabel);
  document.getElementById('videoGrid').appendChild(videoContainer);
}
