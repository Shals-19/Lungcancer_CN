const express = require("express");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Function to read JSON files and handle default data
function readJsonFile(filePath, defaultData) {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return data ? JSON.parse(data) : defaultData;
  } catch (err) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData));  
    return defaultData;
  }
}

const users = readJsonFile("users.json", {});  
const messages = readJsonFile("messages.json", []);  

app.use(express.json());
app.use(express.static("."));  

// Login route
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (users[username] && users[username] === password) {
    return res.json({ success: true });
  }
  return res.json({ success: false, message: "Invalid credentials" });
});

// Signup route
app.post("/signup", (req, res) => {
  const { username, password } = req.body;

  if (users[username]) {
    return res.json({ success: false, message: "Username already taken" });
  }

  users[username] = password;
  fs.writeFileSync("users.json", JSON.stringify(users));  
  return res.json({ success: true });
});

app.get("/chat.html", (req, res) => {
  res.sendFile(__dirname + "/chat.html");
});

// WebSocket (Socket.io) connection
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.emit("past messages", messages);

  // Listen for new chat messages
  socket.on("chat message", (data) => {
    const { username, msg } = data;
    const timestamp = new Date().toLocaleString(); 
  
    const message = {
      username,
      msg,
      timestamp
    };
  
    messages.push(message);
    fs.writeFileSync("messages.json", JSON.stringify(messages));
    io.emit("chat message", message);
  });
  

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
