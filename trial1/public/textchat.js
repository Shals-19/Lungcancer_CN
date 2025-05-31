// Updated textchat.js with proper end-to-end encryption using public key exchange

const socket = io();
const chatBox = document.getElementById('chatBox');
const messageInput = document.getElementById('messageInput');
const sendMessage = document.getElementById('sendMessage');
const participantsList = document.getElementById('participantsList');
const dateTime = document.getElementById('dateTime');
const quoteElem = document.getElementById('quote');
let readyToSend = false;


const username = new URLSearchParams(window.location.search).get('username') || 'Anonymous';
console.log("Logged in as:", username);


// Public/Private keys and a map of public keys
let privateKey;
let publicKey;
const publicKeys = {}; // { username: base64 publicKey }

// Generate RSA key pair and share public key with server
async function generateKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  privateKey = keyPair.privateKey;

  const exported = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  publicKey = btoa(String.fromCharCode(...new Uint8Array(exported)));

  socket.emit("public-key", { username, key: publicKey });
}

// Encrypt message with recipient's public key
async function encryptMessage(recipientKey, message) {
  const importedKey = await window.crypto.subtle.importKey(
    "spki",
    Uint8Array.from(atob(recipientKey), c => c.charCodeAt(0)),
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"]
  );
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    importedKey,
    new TextEncoder().encode(message)
  );
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

// Decrypt message with our private key
async function decryptMessage(encryptedMessage) {
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0))
  );
  return new TextDecoder().decode(decrypted);
}

// Generate key pair and notify server
generateKeyPair();

// Receive public keys of all participants
socket.on('public-keys', (keys) => {
  Object.assign(publicKeys, keys);
  readyToSend = true;
  console.log("Public keys received:", publicKeys);
});

const quotes = [
  "Believe you can and you're halfway there.",
  "Success is not final, failure is not fatal: It is the courage to continue that counts.",
  "The only way to do great work is to love what you do.",
  "You are capable of amazing things.",
  "Stay positive, work hard, make it happen."
];
function showDateTimeAndQuote() {
  const now = new Date();
  dateTime.textContent = now.toLocaleString();
  quoteElem.textContent = quotes[Math.floor(Math.random() * quotes.length)];
}
showDateTimeAndQuote();
setInterval(showDateTimeAndQuote, 60000);

sendMessage.addEventListener('click', async () => {
  const message = messageInput.value.trim();
  if (!readyToSend) {
    alert("Still receiving public keys. Please wait a moment.");
    return;
  }

  if (message) {
    for (const recipient in publicKeys) {
      if (recipient !== username) {
        const encryptedMessage = await encryptMessage(publicKeys[recipient], message);
        socket.emit('chat-message', { to: recipient, from: username, message: encryptedMessage });
      }
    }
    const msgElem = document.createElement('p');
    msgElem.innerHTML = `<span class="username">You:</span> ${escapeHtml(message)}`;
    chatBox.appendChild(msgElem);
    chatBox.scrollTop = chatBox.scrollHeight;
    messageInput.value = '';
  }
});


messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendMessage.click();
  }
});

socket.on('chat-message', async ({ from, to, message }) => {
  console.log(`📩 Message received from ${from} to ${to}`);
  if (to !== username) return; // Ignore messages not meant for this user

  try {
    const decryptedMessage = await decryptMessage(message);
    console.log("🔓 Decrypted message:", decryptedMessage);

    const msgElem = document.createElement('p');
    msgElem.innerHTML = `<span class="username">${from}:</span> ${escapeHtml(decryptedMessage)}`;
    chatBox.appendChild(msgElem);
    chatBox.scrollTop = chatBox.scrollHeight;
  } catch (error) {
    console.error("❌ Decryption failed:", error);
  }
});



let participants = [];
function updateParticipantsList() {
  participantsList.innerHTML = '';
  participants.forEach(participant => {
    const name = participant.name || participant;
    const time = participant.time || '';
    const li = document.createElement('li');
    li.innerHTML = `<span>${name}</span> <span style="color:#888; font-size:12px;">${time ? '(' + time + ')' : ''}</span>`;
    li.style.padding = '4px 0';
    li.style.color = name === username ? '#388e3c' : '#333';
    li.style.fontWeight = name === username ? 'bold' : 'normal';
    participantsList.appendChild(li);
  });
}

const joinTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
socket.emit('join-text-chat', { username, time: joinTime });

socket.on('participants-update', (list) => {
  participants = list;
  updateParticipantsList();
});

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

const welcome = document.createElement('p');
welcome.innerHTML = `<span class="username">Welcome, ${escapeHtml(username)}!</span>`;
welcome.style.color = '#888';
chatBox.appendChild(welcome);
