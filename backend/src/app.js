const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const path = require("path");
const { loadEnv } = require("./utils/loadEnv");
loadEnv();
const PORT = process.env.PORT || 9000;
const url = process.env.MONGO_URL;
const cors = require("cors");
const authRoute = require("./routes/authRoute");
const { handleSocket } = require("./controllers/socketController.js");
const passport = require("passport");
require("../config/Passport");

if (!url) {
  console.warn("MONGO_URL is not set; MongoDB connection will fail.");
}

const server = http.createServer(app);
app.use(express.json());

const corsOrigins = [
  process.env.FRONTEND_URL,
  "https://clear-connect.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:9000",
  "http://127.0.0.1:5173",
  "http://192.168.1.27:5173",
  "http://192.168.1.27:5174",
  "http://192.168.1.27:9000",
].filter(Boolean);

app.use(
  cors({
    origin: corsOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(passport.initialize());
app.use("/", authRoute);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.get("/", (req, res) => {
  res.send("server page");
});
const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

io.on("connection", (socket) => {
  handleSocket(io, socket);
});

async function connectDb() {
  try {
    await mongoose.connect(url, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      family: 4,
    });
    console.log("MongoDB Atlas connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed, but server continues:", err.message);
  }
}

const startServer = (port) => {
  server.once("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Stop the conflicting process and retry.`);
      process.exit(1);
    }
    console.error("Server start failed:", err);
    process.exit(1);
  });

  server.listen(port, async () => {
    console.log(`server is running on port ${port}`);
    await connectDb();
  });
};

startServer(Number(PORT));
module.exports = { app, server, io };
