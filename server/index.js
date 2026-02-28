const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const pool = require("./db");
require("dotenv").config();
const hotelRouter = require("./routers/hotelRouter");
const authRouter = require("./routers/authRouter");
const bookingRouter = require("./routers/bookingRouter");
const path = require("path");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const permissionRouter = require("./routers/permissionRouter");
const globalRouter = require("./routers/globalRouter");

const app = express();
const server = http.createServer(app);

const frontendUrl = process.env.FRONTEND_URL;

const uploadDir = path.join(__dirname, "public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const io = new Server(server, {
  cors: {
    origin: frontendUrl,
    methods: ["GET", "POST", "PUT", "PATCH"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: frontendUrl,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("socketio", io);

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);
  socket.on("join_hotel_room", (hotelId) => {
    socket.join(`hotel_${hotelId}`);
  });
  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

app.use("/api", permissionRouter);
app.use("/api/hotels", hotelRouter);
app.use("/api/auth", authRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/globaldetails", globalRouter);

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ message: "Database Connected!", time: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
