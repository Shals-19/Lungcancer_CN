const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

function showLogin() {
  loginForm.style.display = "block";
  signupForm.style.display = "none";
}

function showSignup() {
  loginForm.style.display = "none";
  signupForm.style.display = "block";
}

async function login() {
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  const response = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const result = await response.json();
  if (result.success) {
    localStorage.setItem('username', username); 
    window.location.href = "/chat.html";  
  } else {
    alert(result.message);
  }
}

async function signup() {
  const username = document.getElementById("signup-username").value;
  const password = document.getElementById("signup-password").value;

  const response = await fetch("/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const result = await response.json();
  if (result.success) {
    alert("Signup successful! Please login.");
    showLogin();
  } else {
    alert(result.message);
  }
}

// Chatroom functionality
const socket = io();

const messageInput = document.getElementById("message");
const sendMessageButton = document.getElementById("sendMessage");
const messagesContainer = document.getElementById("messages");

const username = localStorage.getItem('username'); 

socket.on("past messages", (messages) => {
  messages.forEach((msg) => {
    displayMessage(msg);
  });
});

function displayMessage({ username, msg, timestamp }) {
    const messageElement = document.createElement("div");
    messageElement.innerText = `${timestamp} - ${username}: ${msg}`;
    messagesContainer.appendChild(messageElement);
  }
  

  sendMessageButton.addEventListener("click", () => {
    const msg = messageInput.value.trim();
    if (msg) {
      socket.emit("chat message", { username, msg });
      messageInput.value = "";
    }
  });
  

socket.on("chat message", (msg) => {
  displayMessage(msg);  
});
