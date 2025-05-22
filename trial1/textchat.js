const socket = io();
const chatBox = document.getElementById('chatBox');
const messageInput = document.getElementById('messageInput');
const sendMessage = document.getElementById('sendMessage');
const participantsList = document.getElementById('participantsList');
const dateTime = document.getElementById('dateTime');
const quoteElem = document.getElementById('quote');

// Get username from URL
const username = new URLSearchParams(window.location.search).get('username') || 'Anonymous';

// Motivational quotes
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
setInterval(showDateTimeAndQuote, 60000); // update every minute

// Send message
sendMessage.addEventListener('click', () => {
  const message = messageInput.value.trim();
  if (message) {
    socket.emit('chat-message', { username, message });
    messageInput.value = '';
  }
});

// Send message on Enter key
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendMessage.click();
  }
});

// Receive message
socket.on('chat-message', ({ username: sender, message }) => {
  const msgElem = document.createElement('p');
  msgElem.innerHTML = `<span class="username">${sender}:</span> ${escapeHtml(message)}`;
  chatBox.appendChild(msgElem);
  chatBox.scrollTop = chatBox.scrollHeight;
});

// Participants logic
let participants = [];
function updateParticipantsList() {
  participantsList.innerHTML = '';
  participants.forEach(name => {
    const li = document.createElement('li');
    li.textContent = name;
    li.style.padding = '4px 0';
    li.style.color = name === username ? '#388e3c' : '#333';
    li.style.fontWeight = name === username ? 'bold' : 'normal';
    participantsList.appendChild(li);
  });
}

// Notify server of join
socket.emit('join-text-chat', { username });

// Receive updated participants list
socket.on('participants-update', (list) => {
  participants = list;
  updateParticipantsList();
});

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Optionally, show a welcome message
const welcome = document.createElement('p');
welcome.innerHTML = `<span class="username">Welcome, ${escapeHtml(username)}!</span>`;
welcome.style.color = '#888';
chatBox.appendChild(welcome);